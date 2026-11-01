# Slim Python container for SentraPay ML Inference Sidecar
FROM python:3.11-slim

WORKDIR /app

# Install build dependencies for grpc compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY services/ml-inference-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy proto definition and compile
COPY proto /app/proto
RUN python -m grpc_tools.protoc -I/app/proto --python_out=/app --grpc_python_out=/app /app/proto/fraud_service.proto

# Copy model and server source code
COPY services/ml-inference-service/transaction_fraud_model.pkl .
COPY services/ml-inference-service/server.py .

EXPOSE 50051 8000

CMD ["python", "server.py"]
