# SentraPay API Reference

SentraPay exposes a RESTful API along with a reactive Server-Sent Events (SSE) streaming endpoint. All endpoints are routed through the Nginx API Gateway on port `8080`.

---

## 1. Authentication

Most mutating operations require a Bearer JWT token in the `Authorization` header:
```http
Authorization: Bearer <jwt-token>
```

### Login
```http
POST /api/auth/login
Content-Type: application/json
```
**Request Body**:
```json
{
  "username": "jayavignesh",
  "password": "StrongPassword123!"
}
```
**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "username": "jayavignesh",
    "role": "ADMIN",
    "walletNumber": "W-JAYAVIGNESH-001"
  }
}
```

---

## 2. Wallet & Balances

### Get Current User Wallet
```http
GET /api/wallets/me
Authorization: Bearer <jwt-token>
```
**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "walletNumber": "W-JAYAVIGNESH-001",
    "currency": "INR",
    "currentBalance": 100000.00,
    "activeHolds": 0.00,
    "availableBalance": 100000.00,
    "status": "ACTIVE"
  }
}
```

### List All Wallets (Simulation / Directory)
```http
GET /api/wallets
Authorization: Bearer <jwt-token>
```
**Response (200 OK)**: Returns list of all active wallet accounts across Alice, Bob, and Admin.

---

## 3. Beneficiary Management & Cooling-Off Guardrails

### List Registered Beneficiaries
```http
GET /api/wallets/beneficiaries
Authorization: Bearer <jwt-token>
```
**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "beneficiaryName": "Bob Supplier",
      "recipientWalletNumber": "W-BOB-003",
      "coolingOff": false,
      "coolingOffUntil": "2026-10-31T12:00:00Z",
      "remainingCoolingOffHours": 0,
      "dailyLimit": 50000.00
    },
    {
      "id": 2,
      "beneficiaryName": "New Payee",
      "recipientWalletNumber": "W-ALICE-002",
      "coolingOff": true,
      "coolingOffUntil": "2026-11-02T16:00:00Z",
      "remainingCoolingOffHours": 22,
      "dailyLimit": 5000.00
    }
  ]
}
```

### Register New Beneficiary
```http
POST /api/wallets/beneficiaries
Authorization: Bearer <jwt-token>
Content-Type: application/json
```
**Request Body**:
```json
{
  "beneficiaryName": "David Merchant",
  "recipientWalletNumber": "W-DAVID-004",
  "dailyLimit": 50000.00
}
```
**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Beneficiary registered with 24-hour cooling off security period",
  "data": {
    "id": 3,
    "beneficiaryName": "David Merchant",
    "recipientWalletNumber": "W-DAVID-004",
    "coolingOff": true,
    "coolingOffUntil": "2026-11-02T17:40:00Z",
    "remainingCoolingOffHours": 24,
    "dailyLimit": 5000.00
  }
}
```

---

## 4. Peer-to-Peer Payment Requests ("UPI Collect")

### Create Payment Request
```http
POST /api/wallets/requests
Authorization: Bearer <jwt-token>
Content-Type: application/json
```
**Request Body**:
```json
{
  "payerWalletNumber": "W-ALICE-002",
  "amount": 750.00,
  "currency": "INR",
  "description": "Team lunch split",
  "expiryMinutes": 1440
}
```
**Response (200 OK)**:
```json
{
  "success": true,
  "message": "P2P Payment request generated successfully",
  "data": {
    "id": 10,
    "requestReference": "REQ-1793535200-ABCD1234",
    "requesterWalletNumber": "W-JAYAVIGNESH-001",
    "payerWalletNumber": "W-ALICE-002",
    "amount": 750.00,
    "currency": "INR",
    "description": "Team lunch split",
    "status": "PENDING",
    "expiresAt": "2026-11-02T17:45:00Z",
    "fulfilledPaymentReference": null
  }
}
```

### Get Incoming Requests (Awaiting My Authorization)
```http
GET /api/wallets/requests/incoming
Authorization: Bearer <jwt-token>
```

### Get Outgoing Requests (Initiated By Me)
```http
GET /api/wallets/requests/outgoing
Authorization: Bearer <jwt-token>
```

### Authorize & Pay Collect Request
```http
POST /api/wallets/requests/{reference}/approve
Authorization: Bearer <jwt-token>
Idempotency-Key: e1a3f5a2-93cb-4f80-97db-45f8e12d3456
```
**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Payment request authorized and dispatched to switch",
  "data": {
    "paymentReference": "TXN-1793535250000-A1B2C3D4",
    "status": "INITIATED",
    "amount": 750.00,
    "recipientWallet": "W-JAYAVIGNESH-001"
  }
}
```

### Reject Collect Request
```http
POST /api/wallets/requests/{reference}/reject
Authorization: Bearer <jwt-token>
```
**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Payment request rejected successfully",
  "data": {
    "status": "REJECTED"
  }
}
```

---

## 5. Payments & Saga Switch

### Initiate Transfer
```http
POST /api/payments/transfer
Authorization: Bearer <jwt-token>
Idempotency-Key: c9b2f6b3-85e6-4fa2-93cb-32a1eb7c4d5e
Content-Type: application/json
```
**Request Body**:
```json
{
  "recipientWalletNumber": "W-BOB-003",
  "amount": 500.00,
  "paymentMethod": "UPI",
  "claimedUtr": "HDFC202611019901"
}
```
**Response (202 Accepted)**:
```json
{
  "success": true,
  "data": {
    "paymentReference": "TXN-1793534238868-5A3AA9BB",
    "status": "INITIATED",
    "amount": 500.00,
    "currency": "INR",
    "recipientWallet": "W-BOB-003",
    "holdPlaced": true,
    "createdAt": "2026-11-01T11:15:30.000Z"
  }
}
```

*Note: If the recipient is in cooling-off and the amount exceeds INR 5,000, returns HTTP 400 Bad Request:*
```json
{
  "success": false,
  "message": "Beneficiary 'Bob Demo Payee' is in 24-hour security cooling-off (19 hours remaining). Transfers capped at INR 5000.00."
}
```

---

## 6. AI Fraud Scoring & Metrics

### Direct Risk Evaluation (Sidecar Test)
```http
POST /api/fraud/evaluate
Content-Type: application/json
```
**Request Body**:
```json
{
  "amount": 75000.00,
  "channel": "UPI"
}
```
**Response (200 OK)**:
```json
{
  "verdict": "APPROVE",
  "riskTier": "LOW",
  "fraudProbability": 0.0125,
  "inferenceLatencyMs": 1.45,
  "flaggedIndicators": []
}
```

### Fraud Service Status
```http
GET /api/fraud/status
```
**Response (200 OK)**:
```json
{
  "status": "UP",
  "engine": "LightGBM 4.7.0 GBDT",
  "grpcConnected": true
}
```

---

## 7. Ledger, Audit & Fuzzy Bank Reconciliation

### Query Trial Balance (Double-Entry Invariant)
```http
GET /api/recon/ledger/trial-balance
```
**Response (200 OK)**:
```json
{
  "totalDebits": 107932.00,
  "totalCredits": 107932.00,
  "balanced": true,
  "difference": 0.00,
  "evaluatedAt": "2026-11-01T17:42:00.000Z"
}
```

### Verify Cryptographic Audit Chain
```http
GET /api/recon/audit/verify
```
**Response (200 OK)**:
```json
{
  "valid": true,
  "totalRecordsChecked": 67,
  "brokenBlockId": null,
  "failureMessage": "Cryptographic audit chain fully verified"
}
```

### Upload Bank Statement CSV (SHA-256 Deduplicated)
```http
POST /api/recon/statements/upload
Content-Type: multipart/form-data
```
**Form Fields**:
- `file`: CSV file containing headers `utr_number,amount,payer_vpa`
- `sourceChannel`: Origin banking partner (e.g. `HDFC_BANK`)

**Response (200 OK)**:
```json
{
  "statementId": 16,
  "filename": "bank_feed_1793535000.csv",
  "fileHashSha256": "73a8ddbaff1aef2ce...",
  "totalRecords": 4,
  "matchedRecords": 3,
  "unmatchedRecords": 1,
  "status": "COMPLETED"
}
```

### Inspect Statement Records & Multi-Tier Fuzzy Classifications
```http
GET /api/recon/statements/{id}/records
```
**Response (200 OK)**:
```json
[
  {
    "id": 61,
    "utrNumber": "HDFC202611019901",
    "amount": 250.00,
    "payerVpa": "alice@okaxis",
    "reconciled": true,
    "matchType": "EXACT_MATCH",
    "confidenceScore": 100.00,
    "discrepancyReason": null,
    "reconciledTransactionId": 45
  },
  {
    "id": 62,
    "utrNumber": "HDFC202611019910",
    "amount": 250.00,
    "payerVpa": "bob@okhdfc",
    "reconciled": true,
    "matchType": "FUZZY_MATCH",
    "confidenceScore": 90.00,
    "discrepancyReason": "Damerau-Levenshtein distance 1 to HDFC202611019901",
    "reconciledTransactionId": 45
  },
  {
    "id": 63,
    "utrNumber": "COLLECT-REQ-DEMO-001",
    "amount": 745.00,
    "payerVpa": "merchant@upi",
    "reconciled": true,
    "matchType": "AMOUNT_TOLERANCE",
    "confidenceScore": 92.00,
    "discrepancyReason": "Amount variance INR 5.00 within 2.50% MDR fee tolerance",
    "reconciledTransactionId": 46
  },
  {
    "id": 64,
    "utrNumber": "UNKNOWN_RECON_EXT_9999",
    "amount": 999.00,
    "payerVpa": "stranger@upi",
    "reconciled": false,
    "matchType": "UNMATCHED",
    "confidenceScore": 0.00,
    "discrepancyReason": null,
    "reconciledTransactionId": null
  }
]
```

---

## 8. Real-Time Event Streaming

### Subscribe to Live Kafka Events (SSE)
```http
GET /api/events/stream
Accept: text/event-stream
```
Streams continuous newline-delimited Server-Sent Events with event names `PAYMENT_INITIATED`, `FRAUD_SCORED`, `PAYMENT_SETTLED`, and `RECON_MATCHED`.
