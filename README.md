# SentraPay Platform

[![Java](https://img.shields.io/badge/Java-21%20LTS-18181b?logo=openjdk&logoColor=ED8B00&labelColor=101012)](https://adoptium.net)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.0-18181b?logo=springboot&logoColor=6DB33F&labelColor=101012)](https://spring.io)
[![Apache Kafka](https://img.shields.io/badge/Apache%20Kafka-3.7.0%20KRaft-18181b?logo=apachekafka&logoColor=231F20&labelColor=101012)](https://kafka.apache.org)
[![Redis](https://img.shields.io/badge/Redis-7.2-18181b?logo=redis&logoColor=FF4438&labelColor=101012)](https://redis.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-18181b?logo=postgresql&logoColor=4169E1&labelColor=101012)](https://www.postgresql.org)
[![gRPC](https://img.shields.io/badge/gRPC-Protobuf%20v3-18181b?logo=grpc&logoColor=244C5A&labelColor=101012)](https://grpc.io)
[![LightGBM](https://img.shields.io/badge/LightGBM-4.7.0%20GBDT-18181b?logo=python&logoColor=FF7F0E&labelColor=101012)](https://lightgbm.readthedocs.io)
[![Python](https://img.shields.io/badge/Python-3.11-18181b?logo=python&logoColor=3776AB&labelColor=101012)](https://www.python.org)
[![React](https://img.shields.io/badge/React-18.3-18181b?logo=react&logoColor=61DAFB&labelColor=101012)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-18181b?logo=vite&logoColor=9135FF&labelColor=101012)](https://vite.dev)
[![Docker](https://img.shields.io/badge/Docker-Compose-18181b?logo=docker&logoColor=2496ED&labelColor=101012)](https://www.docker.com)
[![JWT](https://img.shields.io/badge/Security-JWT-18181b?logo=jsonwebtokens&logoColor=FFFFFF&labelColor=101012)](https://jwt.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An enterprise-grade, **event-driven real-time payment switch, AI fraud scoring engine, and institutional double-entry reconciliation platform**. Modeled after production payment networks (Stripe, UPI clearing switches, and Razorpay), SentraPay replaces monolithic database locking with an asynchronous **Choreographed Saga Orchestration pattern** built on **Apache Kafka (KRaft mode)**, **Redis 7.2**, **gRPC**, **PostgreSQL 16**, **LightGBM**, and **Server-Sent Events (SSE)**.

---

## Key Architecture Pillars

- **Choreographed Saga Orchestration (`services/wallet-service` & `services/fraud-service`):**
  Non-blocking transaction workflows across Kafka topics (`payments.initiated`, `payments.fraud-scored`, `payments.settled`), guaranteeing eventual consistency and automated compensating rollbacks without 2-Phase Commit (2PC) bottlenecks.
- **Zero Double-Spending Invariant (`services/wallet-service`):**
  Sub-millisecond distributed idempotency via Redis `SETNX` (24h TTL) paired with atomic PostgreSQL row-level balance reservations before fund dispatch.
- **Sub-2ms AI Risk Scoring Engine (`services/ml-sidecar`):**
  Dual-tier risk engine evaluating deterministic in-memory sliding-window velocity rules (Redis ZSET) alongside native LightGBM gradient boosted decision trees served via binary Protobuf gRPC in 1.4ms.
- **Strict Double-Entry Accounting (`services/reconciliation-service`):**
  Zero-sum ledger where every settled transaction posts balanced multi-leg records satisfying $\sum \text{Debits} - \sum \text{Credits} = 0.00$.
- **Cryptographic Tamper-Evident Audit Trail (`services/reconciliation-service`):**
  Every journal entry is sealed in an immutable forward-chained block using SHA-256 cryptographic hashing ($H_n = \text{SHA-256}(H_{n-1} \parallel \text{EntryData})$).
- **Multi-Tier Fuzzy UTR Matching & Fee Tolerance (`services/reconciliation-service`):**
  Spring Batch 5 reconciliation engine with Damerau-Levenshtein distance (typo and transposition tolerance $\le 2$) and banking merchant fee tolerance (MDR $\le 2.5\%$).
- **Real-Time Streaming UI (`frontend`):**
  Unbuffered Server-Sent Events (SSE) broadcasting live Kafka event progressions directly to a React 18 dashboard in under 5ms.

---

## System Architecture

```mermaid
flowchart TB
    subgraph CLIENT["Client & Edge Tier"]
        UI["React 18 + Tailwind Dashboard<br/>Port: 8080 (via Nginx)"]
        EDGE["Nginx Reverse Proxy & SSE Gateway<br/>Port: 8080"]
        UI <-->|HTTP / Unbuffered SSE| EDGE
    end

    subgraph MESH["Microservices Core Mesh (Java 21 / Spring Boot 3.3)"]
        WALLET["Wallet Service<br/>Port: 8081<br/>• Balances & Transfers<br/>• Redis SETNX Idempotency<br/>• PostgreSQL Row-Level Hold Reserves"]
        FRAUD["Fraud Detection Service<br/>Port: 8082<br/>• Sliding-Window Velocity<br/>• gRPC Protobuf Client<br/>• Saga Decision Verdicts"]
        RECON["Reconciliation & Ledger Service<br/>Port: 8083<br/>• Zero-Sum Journal Entries<br/>• SHA-256 Cryptographic Audit Chain<br/>• Spring Batch 5 UTR Matcher"]
    end

    subgraph SIDECAR["ML Inference Engine (Python 3.11 / LightGBM)"]
        ML["LightGBM Fraud Sidecar<br/>Ports: 8000 (REST) / 50051 (gRPC)<br/>• 1.4ms Vectorized NumPy Inference<br/>• Dynamic Feature Attribution"]
    end

    subgraph EVENT_STREAM["Asynchronous Event Mesh (Apache Kafka KRaft)"]
        KAFKA["Kafka Cluster (KRaft Mode)<br/>Port: 9092<br/>• Topic: payments.initiated<br/>• Topic: payments.fraud-scored<br/>• Topic: payments.settled<br/>• Topic: payments.compensated"]
    end

    subgraph STORAGE["Persistence & Cache Infrastructure (Docker)"]
        PG[("PostgreSQL 16 Enterprise<br/>Port: 5432<br/>• DB: sentrapay_wallet<br/>• DB: sentrapay_recon")]
        REDIS[("Redis 7.2 High-Performance Cache<br/>Port: 6379<br/>• Idempotency Keys (24h TTL)<br/>• ZSET Velocity Sliding-Windows")]
    end

    EDGE -->|Route /api/v1/wallets| WALLET
    EDGE -->|Route /api/v1/fraud| FRAUD
    EDGE -->|Route /api/v1/recon| RECON

    WALLET <-->|Idempotency & Holds| REDIS
    WALLET <-->|Balance Records| PG
    WALLET -->|Publish payments.initiated| KAFKA

    KAFKA -->|Consume payments.initiated| FRAUD
    FRAUD <-->|Velocity Check (ZSET)| REDIS
    FRAUD <-->|gRPC Binary Protobuf (:50051)| ML
    FRAUD -->|Publish payments.fraud-scored| KAFKA

    KAFKA -->|Consume Decision| WALLET
    WALLET -->|Publish payments.settled| KAFKA

    KAFKA -->|Consume Settlement| RECON
    RECON <-->|Post Double-Entry Ledgers & Merkle Chain| PG
```

---

## Double-Entry Ledger & Cryptographic Invariants

SentraPay enforces institutional banking consistency through balanced accounting entries and cryptographic hash chains:

$$\sum_{i=1}^{k} \text{Debits}_i - \sum_{j=1}^{m} \text{Credits}_j = 0.00$$

$$H_n = \text{SHA-256}(H_{n-1} \parallel \text{TxId} \parallel \text{Amount} \parallel \text{Timestamp})$$

| Account | Entry Type | Invariant Constraint | Failure Action |
| :--- | :---: | :--- | :--- |
| **`USER_WALLET`** | `DEBIT` | Available Balance $\ge$ Transfer Amount | Immediate rejection (`INSUFFICIENT_FUNDS`) |
| **`ESCROW_HOLD`** | `CREDIT` | Balance held atomically during Saga lifecycle | Compensating unlock on fraud trigger |
| **`SETTLEMENT_CLEARING`** | `DEBIT / CREDIT` | Must match external banking settlement report | Flagged for manual audit in Spring Batch |
| **`PLATFORM_FEE`** | `CREDIT` | Contractual fee percentage (MDR $\le 2.5\%$) | Recorded in institutional revenue account |

---

## Quickstart & Platform Orchestration

### Prerequisites
- Docker Desktop (with WSL2 or Linux containers)
- Java 21 LTS & Maven 3.9+
- Python 3.11+
- Node.js 20+ & npm

---

### Option A: Automated Docker Compose Orchestration (Recommended)

Launch all 8 services, datastores, Kafka broker, and web UI in a single command:
```bash
docker compose up -d
```
*Automatically starts PostgreSQL 16 (`:5432`), Redis 7.2 (`:6379`), Kafka KRaft (`:9092`), Python LightGBM Sidecar (`:50051`, `:8000`), Wallet Service (`:8081`), Fraud Service (`:8082`), Recon Service (`:8083`), and Nginx Gateway (`:8080`).*

To cleanly shut down all containers and networks:
```bash
docker compose down -v
```

---

### Option B: Step-by-Step Manual Launch

#### Step 1: Start Infrastructure Datastores & Kafka
```bash
docker compose up -d postgres redis kafka
```

#### Step 2: Launch LightGBM ML Sidecar
```bash
cd services/ml-sidecar
python -m venv .venv
# Activate venv: .venv\Scripts\activate (Windows) or source .venv/bin/activate (Linux/macOS)
pip install -r requirements.txt
python server.py
# gRPC listening on :50051, REST on :8000
```

#### Step 3: Launch Java Core Microservices
```bash
# Terminal 1: Wallet Service
cd services/wallet-service && mvn spring-boot:run

# Terminal 2: Fraud Detection Service
cd services/fraud-service && mvn spring-boot:run

# Terminal 3: Reconciliation & Ledger Service
cd services/reconciliation-service && mvn spring-boot:run
```

#### Step 4: Launch React Dashboard
```bash
cd frontend
npm install
npm run dev
# Dashboard active at: http://localhost:8080 (or :5173 standalone)
```

---

## Decoupled Environment Strategy

All services extract connection strings, credentials, and Kafka topics into environment files with resilient local fallbacks:

| Service / Layer | Config File | Template Reference | Key Variables |
| :--- | :--- | :--- | :--- |
| **Frontend Studio** | `frontend/vite.config.js` | [`frontend/.env.example`](frontend/.env.example) | `VITE_API_GATEWAY_URL`, `VITE_SSE_ENDPOINT` |
| **Wallet Service** | `application.yml` | [`services/wallet-service/.env.example`](services/wallet-service/.env.example) | `SPRING_KAFKA_BOOTSTRAP_SERVERS`, `POSTGRES_URL`, `REDIS_HOST` |
| **Fraud Service** | `application.yml` | [`services/fraud-service/.env.example`](services/fraud-service/.env.example) | `ML_GRPC_HOST`, `ML_GRPC_PORT`, `REDIS_VELOCITY_TTL` |
| **Recon Service** | `application.yml` | [`services/reconciliation-service/.env.example`](services/reconciliation-service/.env.example) | `RECON_BATCH_CHUNK_SIZE`, `AUDIT_CHAIN_PEPPER` |
| **ML Sidecar** | `config.py` | [`services/ml-sidecar/.env.example`](services/ml-sidecar/.env.example) | `GRPC_PORT`, `REST_PORT`, `MODEL_FILE_PATH` |

---

## Live Telemetry & Observability Hubs

| Hub / Service | Port | URL | Role & Live Features |
| :--- | :--- | :--- | :--- |
| **Nginx Gateway & Web UI** | `8080` | [http://localhost:8080](http://localhost:8080) | Live Transaction Studio, Kafka SSE Stream, & Wallet Interface. |
| **Wallet Service API** | `8081` | [http://localhost:8081/actuator/health](http://localhost:8081/actuator/health) | Balance allocations, transfers, and idempotency engine. |
| **Fraud Service API** | `8082` | [http://localhost:8082/actuator/health](http://localhost:8082/actuator/health) | Velocity checks, gRPC inference bridge, and risk verdicts. |
| **Recon & Ledger API** | `8083` | [http://localhost:8083/actuator/health](http://localhost:8083/actuator/health) | Immutable SHA-256 audit ledger & Spring Batch jobs. |
| **ML Sidecar Health** | `8000` | [http://localhost:8000/health](http://localhost:8000/health) | LightGBM vectorized model inference runtime status. |
| **Kafka Broker** | `9092` | `localhost:9092` | Event-driven event hub for orchestrated Saga pipelines. |

---

## Testing & Quality Assurance Suite

### End-to-End Microservice Tests (Java 21)
```bash
# Run test suites across all Spring Boot microservices
mvn test
# Verifies Saga state machines, idempotency locks, and zero-sum double-entry ledgers.
```

### ML Sidecar Model Attribution Tests (Python 3.11)
```bash
cd services/ml-sidecar
pytest tests/ -v
# Validates 1.4ms inference benchmark, feature attribution, and gRPC payload parsing.
```

### Sample Payment Transfer Request
```bash
curl -X POST http://localhost:8080/api/v1/wallets/transfer \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: idemp-94a1-432b-8101" \
  -d '{
    "sourceWalletId": "W-JAYAVIGNESH-001",
    "destinationWalletId": "W-ALICE-002",
    "amount": 2500.00,
    "currency": "INR",
    "note": "Production payment switch transfer"
  }'
```

---

## Author

**Jayavignesh**
- **Website:** [jayavignesh.dev](https://jayavignesh.dev)
- **GitHub:** [@i-viki](https://github.com/i-viki)
- **Email:** [hello@jayavignesh.dev](mailto:hello@jayavignesh.dev)

---

## License

This platform is distributed under the **MIT License**. See the [`LICENSE`](LICENSE) file for complete terms.
