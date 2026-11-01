"""
SentraPay ML Training Pipeline - Step 3: Decision Threshold & Financial Cost Matrix
Calculates financial risk trade-offs and net currency loss across varying probability cutoffs
to mathematically identify the optimal cost-minimizing decision threshold.
"""

from pathlib import Path
import joblib
import pandas as pd
import numpy as np

from sklearn.metrics import (
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score
)

BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "synthetic_transactions.csv"
MODEL_PATH = BASE_DIR.parent / "transaction_fraud_model.pkl"

if not DATASET_PATH.exists():
    raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")
if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model artifact not found at {MODEL_PATH}")

df = pd.read_csv(DATASET_PATH)

if "timestamp" in df.columns:
    df = df.sort_values(by="timestamp").reset_index(drop=True)
    df_features = df.drop(columns=["timestamp", "is_fraud"])
else:
    df_features = df.drop(columns=["is_fraud"])

y = df["is_fraud"]

# Chronological Out-Of-Time test split matching training
split_idx = int(len(df) * 0.80)
X_test = df_features.iloc[split_idx:]
y_test = y.iloc[split_idx:]
amounts_test = df["amount"].iloc[split_idx:].values

artifact = joblib.load(MODEL_PATH)
model = artifact["model"]

classifier = model.named_steps.get("classifier", model)
classes = list(getattr(classifier, "classes_", [0, 1]))
fraud_idx = classes.index(1) if 1 in classes else 1

probabilities = model.predict_proba(X_test)[:, fraud_idx]

# ----------------------------------------------------------------------------
# Financial Cost Model Parameters (Fintech Standard)
# ----------------------------------------------------------------------------
# False Negative (FN): Direct fiat loss = 100% of transaction amount + chargeback fee
CHARGEBACK_PENALTY_INR = 50.0  # Bank processing penalty per disputed chargeback

# False Positive (FP): User friction, OTP SMS delivery, support ticket, lost GMV
USER_FRICTION_COST_INR = 25.0  # Operational cost per falsely declined user

print("\n" + "=" * 90)
print("FINANCIAL COST-SENSITIVE DECISION THRESHOLD MATRIX (Razorpay / Stripe Model)")
print("=" * 90)
print(f"OOT Test Window: {len(y_test)} transactions | Actual Fraud: {int(y_test.sum())} ({y_test.mean()*100:.2f}%)")
print(f"Total Test Volume: INR {amounts_test.sum():,.2f} | Total Fraud at Risk: INR {amounts_test[y_test == 1].sum():,.2f}\n")

header = f"{'Cutoff':>7} | {'Precision':>9} | {'Recall':>8} | {'FP (Friction)':>13} | {'FN (Missed)':>11} | {'Fraud Loss (INR)':>16} | {'Total Cost (INR)':>16} | {'Action Tier':<15}"
print(header)
print("-" * len(header))

grid_thresholds = [0.10, 0.20, 0.25, 0.30, 0.40, 0.50, 0.60, 0.70, 0.75, 0.80, 0.90]

best_threshold = 0.50
lowest_cost = float("inf")
best_stats = {}

for cutoff in grid_thresholds:
    predictions = (probabilities >= cutoff).astype(int)

    # Class breakdown
    tn, fp, fn, tp = confusion_matrix(y_test, predictions, labels=[0, 1]).ravel()

    precision = precision_score(y_test, predictions, zero_division=0)
    recall = recall_score(y_test, predictions, zero_division=0)

    # Financial Cost Calculation
    # Uncaught fraud amounts
    fn_mask = (y_test.values == 1) & (predictions == 0)
    fraud_amount_lost = float(amounts_test[fn_mask].sum()) + (fn * CHARGEBACK_PENALTY_INR)

    # False alarm friction costs
    friction_cost_total = fp * USER_FRICTION_COST_INR

    total_financial_loss = fraud_amount_lost + friction_cost_total

    tier = "MONITOR"
    if cutoff >= 0.70:
        tier = "AUTO_REJECT (Saga)"
    elif cutoff >= 0.50:
        tier = "STEP_UP_2FA"
    elif cutoff >= 0.25:
        tier = "MANUAL_REVIEW"

    if total_financial_loss < lowest_cost:
        lowest_cost = total_financial_loss
        best_threshold = cutoff
        best_stats = {
            "cutoff": cutoff,
            "precision": precision,
            "recall": recall,
            "fp": fp,
            "fn": fn,
            "loss": fraud_amount_lost,
            "total_cost": total_financial_loss,
            "tier": tier
        }

    print(f"{cutoff:7.2f} | {precision:9.4f} | {recall:8.4f} | {fp:13d} | {fn:11d} | INR {fraud_amount_lost:12,.2f} | INR {total_financial_loss:12,.2f} | {tier:<15}")

print("-" * len(header))
print(f"\nOPTIMAL COST-MINIMIZING THRESHOLD: {best_threshold:.2f}")
print(f"  Lowest Total Financial Cost:  INR {lowest_cost:,.2f}")
print(f"  Fraud Catch Rate (Recall):    {best_stats['recall']*100:.2f}%")
print(f"  Precision:                    {best_stats['precision']*100:.2f}%")
print(f"  Uncaught Fraud Losses:        INR {best_stats['loss']:,.2f} ({best_stats['fn']} missed transactions)")
print(f"  Falsely Declined Users:       {best_stats['fp']} users (Friction: INR {best_stats['fp'] * USER_FRICTION_COST_INR:,.2f})")
print(f"  Assigned System Tier:         {best_stats['tier']}")
