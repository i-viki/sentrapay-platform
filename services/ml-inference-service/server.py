import os
import sys
import time
import logging
from concurrent import futures
from pathlib import Path

import joblib
import numpy as np
try:
    import lightgbm as lgb
except ImportError:
    lgb = None

import grpc
from fastapi import FastAPI
import uvicorn
import threading

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ml-inference-service")

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "transaction_fraud_model.pkl"

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model artifact not found at {MODEL_PATH}")

logger.info(f"Loading Random Forest model artifact from {MODEL_PATH}...")
artifact = joblib.load(MODEL_PATH)
raw_model = artifact["model"] if isinstance(artifact, dict) and "model" in artifact else artifact

# Extract core RandomForestClassifier from Pipeline to eliminate ColumnTransformer/Pandas overhead
if hasattr(raw_model, "named_steps") and "classifier" in raw_model.named_steps:
    classifier = raw_model.named_steps["classifier"]
    logger.info("Extracted native RandomForestClassifier from Pipeline.")
else:
    classifier = raw_model

# Pin single-thread execution for single-row inference (eliminates joblib thread-pool thrashing)
if hasattr(classifier, "n_jobs"):
    classifier.n_jobs = 1

fraud_class_idx = 1
try:
    if hasattr(classifier, "classes_"):
        classes = list(classifier.classes_)
        if 1 in classes:
            fraud_class_idx = classes.index(1)
except Exception:
    fraud_class_idx = 1

# O(1) categorical 1-hot feature column indices (matching the 14-dim pipeline schema)
# Indices 0..3: transaction_type ['DEPOSIT', 'PAYMENT', 'TRANSFER', 'WITHDRAWAL']
# Indices 4..7: payment_method ['BANK_TRANSFER', 'CARD', 'UPI', 'WALLET']
# Indices 8..13: numeric features
TX_TYPE_MAP = {
    "DEPOSIT": 0,
    "PAYMENT": 1,
    "TRANSFER": 2,
    "WITHDRAWAL": 3
}

PAYMENT_METHOD_MAP = {
    "BANK_TRANSFER": 4,
    "CARD": 5,
    "UPI": 6,
    "WALLET": 7
}

# Feature importance weights learned by the 200 Random Forest trees
FEATURE_IMPORTANCE_WEIGHTS = {
    "minutes_since_last_txn": 0.3389,
    "sender_txn_count_10m": 0.2576,
    "receiver_txn_count_10m": 0.1603,
    "amount": 0.1073,
    "location_changed": 0.0520,
    "transaction_hour": 0.0305,
}

# Pre-warm the classifier in memory to eliminate first-call JIT/cache cold-start latency
_dummy_vector = np.zeros((1, 14), dtype=np.float32)
_dummy_vector[0, 2] = 1.0  # TRANSFER
_dummy_vector[0, 7] = 1.0  # WALLET
_dummy_vector[0, 8:] = [500.0, 1.0, 1.0, 10.0, 0.0, 12.0]
classifier.predict_proba(_dummy_vector)
logger.info(f"Model pre-warmed. Fast NumPy vector engine active. Fraud class index: {fraud_class_idx}")

# Compile proto if stubs not present
PROTO_DIR = BASE_DIR.parent.parent / "proto"
PROTO_FILE = PROTO_DIR / "fraud_service.proto"

if PROTO_FILE.exists() and not (BASE_DIR / "fraud_service_pb2.py").exists():
    logger.info("Compiling Protobuf definitions...")
    from grpc_tools import protoc
    protoc.main([
        "grpc_tools.protoc",
        f"-I{PROTO_DIR}",
        f"--python_out={BASE_DIR}",
        f"--grpc_python_out={BASE_DIR}",
        str(PROTO_FILE)
    ])

try:
    import fraud_service_pb2 as pb2
    import fraud_service_pb2_grpc as pb2_grpc
except ImportError:
    from . import fraud_service_pb2 as pb2
    from . import fraud_service_pb2_grpc as pb2_grpc


def evaluate_features_fast(amount: float, sender_velocity_10m: int, receiver_velocity_10m: int,
                           minutes_since_last: float, location_changed: int, hour: int,
                           tx_type: str, payment_method: str):
    """
    Ultra-low-latency NumPy vectorized inference bypassing Pandas DataFrame allocations.
    Executes in under 5ms with deterministic O(1) memory complexity.
    """
    start = time.perf_counter_ns()

    # Pre-allocate contiguous 14-element float32 array
    x = np.zeros((1, 14), dtype=np.float32)

    # 1-hot categorical features
    t_key = str(tx_type or "").upper()
    p_key = str(payment_method or "").upper()
    x[0, TX_TYPE_MAP.get(t_key, 2)] = 1.0
    x[0, PAYMENT_METHOD_MAP.get(p_key, 7)] = 1.0

    # Numeric features
    x[0, 8] = float(amount)
    x[0, 9] = float(sender_velocity_10m)
    x[0, 10] = float(receiver_velocity_10m)
    x[0, 11] = max(0.1, float(minutes_since_last))
    x[0, 12] = float(location_changed)
    x[0, 13] = float(hour)

    # Direct C-level tree traversal
    probabilities = classifier.predict_proba(x)[0]
    prob = float(probabilities[fraud_class_idx])
    elapsed_nanos = time.perf_counter_ns() - start

    # Tier and action determination
    if prob >= 0.70:
        tier = "HIGH"
        action = "REJECT"
    elif prob >= 0.25:
        tier = "MEDIUM"
        action = "MANUAL_REVIEW"
    else:
        tier = "LOW"
        action = "APPROVE"

    # Dynamic Explainability / Feature Attribution
    flagged = []
    if prob >= 0.70:
        flagged.append("HIGH_MODEL_FRAUD_PROBABILITY")
    if sender_velocity_10m > 3:
        flagged.append(f"HIGH_VELOCITY_BURST (Velocity: {sender_velocity_10m} tx/min, Weight: 25.8%)")
    if amount > 50000.0:
        flagged.append(f"LARGE_TRANSFER_AMOUNT (Amount: INR {amount:,.2f}, Weight: 10.7%)")
    if minutes_since_last < 1.0 and sender_velocity_10m > 1:
        flagged.append(f"RAPID_INTER_TXN_INTERVAL (Interval: {minutes_since_last:.1f}m, Weight: 33.9%)")
    if receiver_velocity_10m > 5:
        flagged.append(f"RECIPIENT_VELOCITY_SPIKE (Receiver: {receiver_velocity_10m} tx/hr, Weight: 16.0%)")
    if location_changed == 1:
        flagged.append("ANOMALOUS_GEO_LOCATION_CHANGE (Weight: 5.2%)")
    if hour < 4 or hour > 23:
        flagged.append(f"OFF_HOURS_SETTLEMENT (Hour: {hour:02d}:00 UTC, Weight: 3.0%)")

    return prob, tier, action, elapsed_nanos, flagged


class FraudInferenceServicer(pb2_grpc.FraudInferenceServiceServicer):
    def EvaluatePaymentRisk(self, request, context):
        try:
            logger.info(f"gRPC EvaluatePaymentRisk received: tx={request.transaction_id}, amount={request.amount}, velocity={request.velocity_last_1min}")
            prob, tier, action, elapsed_nanos, flagged = evaluate_features_fast(
                amount=request.amount,
                sender_velocity_10m=request.velocity_last_1min,
                receiver_velocity_10m=request.velocity_last_1hour,
                minutes_since_last=10.0,
                location_changed=0,
                hour=request.hour_of_day,
                tx_type=request.payment_channel,
                payment_method=request.payment_channel
            )

            logger.info(f"gRPC Evaluated tx={request.transaction_id}: prob={prob:.4f}, tier={tier}, action={action} in {elapsed_nanos/1e6:.2f} ms")

            return pb2.PaymentRiskResponse(
                transaction_id=request.transaction_id,
                fraud_probability=round(prob, 4),
                risk_tier=tier,
                action=action,
                inference_time_nanos=elapsed_nanos,
                flagged_indicators=flagged
            )
        except Exception as e:
            logger.error(f"Error during gRPC risk evaluation: {e}", exc_info=True)
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return pb2.PaymentRiskResponse(
                transaction_id=request.transaction_id,
                fraud_probability=1.0,
                risk_tier="HIGH",
                action="MANUAL_REVIEW",
                inference_time_nanos=0,
                flagged_indicators=["EVALUATION_ERROR"]
            )

    def HealthCheck(self, request, context):
        return pb2.HealthResponse(status="SERVING")


# FastAPI App for HTTP Health Check and fallback REST API
app = FastAPI(title="SentraPay ML Inference Sidecar", version="1.1.0")


@app.get("/health")
def health():
    engine_name = artifact.get("engine", "LightGBM" if "LGBM" in type(classifier).__name__ else "RandomForestClassifier")
    return {
        "status": "UP",
        "service": "ml-inference-service",
        "model": type(classifier).__name__,
        "engine": f"Optimized {engine_name} Vectorized (n_jobs=1)",
        "features_dim": 14,
        "grpc_status": "SERVING"
    }


@app.post("/predict")
def predict(payload: dict):
    tx_id = payload.get("transaction_id", "ANONYMOUS")
    amount = float(payload.get("amount", 0.0))
    v1m = int(payload.get("velocity_last_1min", 1))
    v1h = int(payload.get("velocity_last_1hour", 1))
    channel = str(payload.get("payment_channel", "UPI"))
    hour = int(payload.get("hour_of_day", 12))

    logger.info(f"HTTP /predict received: tx={tx_id}, amount={amount}, channel={channel}, velocity={v1m}")

    prob, tier, action, elapsed, flagged = evaluate_features_fast(
        amount=amount,
        sender_velocity_10m=v1m,
        receiver_velocity_10m=v1h,
        minutes_since_last=10.0,
        location_changed=0,
        hour=hour,
        tx_type=channel,
        payment_method=channel
    )

    logger.info(f"HTTP Evaluated tx={tx_id}: prob={prob:.4f}, tier={tier}, action={action} in {elapsed/1e6:.2f} ms")

    return {
        "transaction_id": tx_id,
        "fraud_probability": round(prob, 4),
        "risk_tier": tier,
        "action": action,
        "inference_time_nanos": elapsed,
        "flagged_indicators": flagged
    }


def start_grpc_server(port=50051):
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    pb2_grpc.add_FraudInferenceServiceServicer_to_server(FraudInferenceServicer(), server)
    server.add_insecure_port(f"0.0.0.0:{port}")
    server.start()
    logger.info(f"gRPC FraudInferenceService listening on port {port}")
    server.wait_for_termination()


if __name__ == "__main__":
    grpc_port = int(os.environ.get("GRPC_PORT", "50051"))
    http_port = int(os.environ.get("HTTP_PORT", "8000"))

    # Launch gRPC in daemon thread
    t = threading.Thread(target=start_grpc_server, args=(grpc_port,), daemon=True)
    t.start()

    logger.info(f"FastAPI HTTP Server starting on port {http_port} (Optimized Vectorized Engine)")
    uvicorn.run(app, host="0.0.0.0", port=http_port, log_level="warning")
