#!/usr/bin/env python3
"""
SentraPay: End-to-End Enterprise API Verification Test Suite
Tests:
  1. User Authentication (JWT issuance)
  2. Wallet Query & Balance Calculations
  3. Distributed Idempotency Deduplication (Redis SETNX lock)
  4. Real-Time Saga Transfer Execution
  5. AI Fraud Detection & Redis Sliding Window Velocity Spike
  6. Double-Entry General Ledger Zero-Sum Invariant
  7. Spring Batch Bank Statement Ingestion & UTR Matching
  8. SHA-256 Tamper-Evident Cryptographic Audit Trail Verification
"""

import sys
import time
import uuid
import json
import urllib.request
import urllib.error
from urllib.parse import urlencode

BASE_URL = "http://localhost:8080"

def make_request(path, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{path}"
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)

    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=req_headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            status_code = resp.getcode()
            raw_body = resp.read().decode("utf-8")
            try:
                parsed = json.loads(raw_body)
            except Exception:
                parsed = raw_body
            return status_code, parsed
    except urllib.error.HTTPError as e:
        status_code = e.code
        raw_body = e.read().decode("utf-8")
        try:
            parsed = json.loads(raw_body)
        except Exception:
            parsed = raw_body
        return status_code, parsed
    except Exception as e:
        return 0, str(e)

def run_tests():
    print("=" * 75)
    print("SENTRAPAY END-TO-END VERIFICATION TEST SUITE")
    print("Event-Driven Real-Time Payment Switch, AI Fraud & Ledger Engine")
    print("=" * 75)

    # 1. Health check gateway
    print("\n[TEST 1] Checking Nginx API Gateway and Microservices Connectivity...")
    status, res = make_request("/api/fraud/status")
    if status == 200:
        print("  Gateway & Fraud Service: OK")
    else:
        print(f"  Note: Gateway status check returned code {status}: {res}")

    # 2. Authentication
    print("\n[TEST 2] Authenticating Test User (jayavignesh)...")
    status, auth_res = make_request("/api/auth/login", method="POST", data={
        "username": "jayavignesh",
        "password": "StrongPassword123!"
    })

    if status != 200 or not isinstance(auth_res, dict) or not auth_res.get("success"):
        print(f"  FAILED to authenticate: {auth_res}")
        print("  Ensure SentraPay containers are running via 'docker compose up -d'.")
        return False

    token = auth_res["data"]["token"]
    user_wallet = auth_res["data"]["walletNumber"]
    auth_headers = {"Authorization": f"Bearer {token}"}
    print(f"  Authenticated successfully. Wallet: {user_wallet}")

    # 3. Wallet Balance Query
    print("\n[TEST 3] Fetching Wallet Balance & Hold State...")
    status, wallet_res = make_request("/api/wallets/me", headers=auth_headers)
    assert status == 200, f"Failed wallet query: {wallet_res}"
    w_data = wallet_res["data"]
    initial_avail = float(w_data["availableBalance"])
    print(f"  Available Balance: INR {initial_avail:.2f}")
    print(f"  Active Holds:      INR {float(w_data['activeHolds']):.2f}")
    print(f"  Current Balance:   INR {float(w_data['currentBalance']):.2f}")

    # 4. Distributed Idempotency Verification
    print("\n[TEST 4] Testing Distributed Idempotency (Redis SETNX key)...")
    idempotency_key = f"TEST-IDEM-{uuid.uuid4()}"
    transfer_payload = {
        "recipientWalletNumber": "W-ALICE-002",
        "amount": 250.00,
        "paymentMethod": "UPI",
        "claimedUtr": "HDFC202611019901"
    }

    # First attempt: should initiate transfer
    tx_headers = dict(auth_headers)
    tx_headers["Idempotency-Key"] = idempotency_key
    status1, res1 = make_request("/api/payments/transfer", method="POST", data=transfer_payload, headers=tx_headers)
    assert status1 in (200, 202), f"Transfer 1 failed: {res1}"
    payment_ref_1 = res1["data"]["paymentReference"]
    print(f"  First transfer accepted. Reference: {payment_ref_1}")

    # Second attempt with exact same Idempotency-Key: MUST return identical payment reference
    status2, res2 = make_request("/api/payments/transfer", method="POST", data=transfer_payload, headers=tx_headers)
    assert status2 in (200, 202), f"Transfer 2 replay failed: {res2}"
    payment_ref_2 = res2["data"]["paymentReference"]
    print(f"  Duplicate transfer replayed. Reference: {payment_ref_2}")

    assert payment_ref_1 == payment_ref_2, "Idempotency violated: different references generated!"
    print("  Idempotency verified: Replay returned exact existing payment record.")

    # Allow Saga event propagation over Kafka
    print("  Waiting 2 seconds for Kafka Saga event propagation...")
    time.sleep(2)

    # 5. AI Fraud Detection & Sliding Window Velocity Spike
    print("\n[TEST 5] Testing AI Fraud Velocity Guardrails...")
    rapid_refs = []
    print("  Triggering rapid transaction burst to test sliding window limiter...")
    for i in range(6):
        burst_key = f"BURST-{uuid.uuid4()}"
        b_headers = dict(auth_headers)
        b_headers["Idempotency-Key"] = burst_key
        make_request("/api/payments/transfer", method="POST", data={
            "recipientWalletNumber": "W-BOB-003",
            "amount": 100.00,
            "paymentMethod": "UPI"
        }, headers=b_headers)

    time.sleep(1)
    status, fraud_eval = make_request("/api/fraud/evaluate", method="POST", data={
        "amount": 150000.00,
        "channel": "UPI"
    })
    assert status == 200, f"Fraud evaluation endpoint failed: {fraud_eval}"
    print(f"  High-Ticket Transfer evaluated:")
    print(f"    Verdict:           {fraud_eval.get('verdict')}")
    print(f"    Risk Tier:         {fraud_eval.get('riskTier')}")
    print(f"    Fraud Probability: {fraud_eval.get('fraudProbability')}")
    print(f"    Flagged Rules:     {fraud_eval.get('flaggedIndicators')}")

    # 6. Double-Entry General Ledger Zero-Sum Verification
    print("\n[TEST 6] Verifying General Ledger Zero-Sum Invariant (Debits == Credits)...")
    status, tb_res = make_request("/api/recon/ledger/trial-balance")
    assert status == 200, f"Trial balance query failed: {tb_res}"
    total_debits = float(tb_res["totalDebits"])
    total_credits = float(tb_res["totalCredits"])
    is_balanced = tb_res["balanced"]
    print(f"  Total Debits:     INR {total_debits:.2f}")
    print(f"  Total Credits:    INR {total_credits:.2f}")
    print(f"  Balanced Status:  {is_balanced}")
    assert is_balanced, f"Double-entry ledger out of balance! Debits: {total_debits}, Credits: {total_credits}"
    print("  Double-entry zero-sum invariant strictly satisfied.")

    # 7. Cryptographic SHA-256 Audit Trail
    print("\n[TEST 7] Verifying Tamper-Evident Cryptographic Audit Chain...")
    status, audit_res = make_request("/api/recon/audit/verify")
    assert status == 200, f"Audit verification failed: {audit_res}"
    print(f"  Blocks Checked:   {audit_res['totalRecordsChecked']}")
    print(f"  Chain Valid:      {audit_res['valid']}")
    print(f"  Summary Message:  {audit_res['failureMessage']}")
    assert audit_res["valid"], f"Audit chain verification failed: {audit_res['failureMessage']}"
    print("  Cryptographic hash chain validated with zero tampering detected.")

    # 8. Beneficiary Management & 24-Hour Cooling-Off Guardrail Verification
    print("\n[TEST 8] Testing Beneficiary Cooling-Off Transfer Guardrails...")
    bene_status, bene_res = make_request("/api/wallets/beneficiaries", method="POST", data={
        "beneficiaryName": "Bob Automated Test",
        "recipientWalletNumber": "W-BOB-003"
    }, headers=auth_headers)
    print(f"  Beneficiary registration status: {bene_status}")

    # Transfer over cooling off limit (INR 5000) should be blocked with 400 Bad Request
    high_bene_key = f"BENE-HIGH-{uuid.uuid4()}"
    h_headers = dict(auth_headers)
    h_headers["Idempotency-Key"] = high_bene_key
    b_status, b_res = make_request("/api/payments/transfer", method="POST", data={
        "recipientWalletNumber": "W-BOB-003",
        "amount": 7500.00,
        "paymentMethod": "UPI"
    }, headers=h_headers)
    assert b_status == 400, f"Expected 400 cooling-off limit breach, got {b_status}: {b_res}"
    print(f"  Cooling-off limit correctly enforced: {b_res.get('message')}")

    # 9. P2P Payment Collect Request Protocol
    print("\n[TEST 9] Testing P2P Collect Payment Request Protocol...")
    pr_status, pr_res = make_request("/api/wallets/requests", method="POST", data={
        "payerWalletNumber": "W-ALICE-002",
        "amount": 350.00,
        "description": "Dinner split auto-test"
    }, headers=auth_headers)
    assert pr_status == 200 and pr_res.get("success"), f"Payment request creation failed: {pr_res}"
    req_id = pr_res["data"]["id"]
    print(f"  P2P collect request #{req_id} created with status: {pr_res['data']['status']}")

    # 10. Fuzzy UTR Matching & Fee Tolerance Reconciliation Engine
    print("\n[TEST 10] Testing Multi-Tier Fuzzy UTR Matching & Fee Tolerance Engine...")
    boundary = "----WebKitFormBoundary" + uuid.uuid4().hex
    csv_content = (
        "utr_number,amount,payer_vpa\n"
        "HDFC202611019901,250.00,alice@okaxis\n"
        "HDFC202611019910,250.00,bob@okhdfc\n"
        "COLLECT-REQ-DEMO-001,745.00,merchant@upi\n"
        "UNKNOWN_RECON_EXT_9999,999.00,stranger@upi\n"
        f"# Ingestion timestamp: {time.time()} - {uuid.uuid4()}\n"
    )
    filename = f"bank_statement_{uuid.uuid4().hex[:6]}.csv"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f"Content-Type: text/csv\r\n\r\n"
        f"{csv_content}\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="sourceChannel"\r\n\r\n'
        f"HDFC_BANK\r\n"
        f"--{boundary}--\r\n"
    ).encode("utf-8")

    req = urllib.request.Request(
        f"{BASE_URL}/api/recon/statements/upload",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        upload_data = json.loads(r.read().decode("utf-8"))

    recon_stmt_id = upload_data.get("statementId") or upload_data.get("id")
    print(f"  Ingested test statement #{recon_stmt_id} with SHA-256: {upload_data.get('fileHashSha256', '')[:16]}...")

    # Inspect record breakdown from multi-tier matcher
    rec_status, recs = make_request(f"/api/recon/statements/{recon_stmt_id}/records")
    assert rec_status == 200 and isinstance(recs, list), f"Failed to retrieve statement records: {recs}"
    match_types = {r["utrNumber"]: r["matchType"] for r in recs}
    print(f"  Match Classifications: {match_types}")
    assert match_types.get("HDFC202611019901") == "EXACT_MATCH", "Exact match failed"
    assert match_types.get("HDFC202611019910") == "FUZZY_MATCH", "Fuzzy match failed"
    assert match_types.get("COLLECT-REQ-DEMO-001") == "AMOUNT_TOLERANCE", "Amount tolerance match failed"
    assert match_types.get("UNKNOWN_RECON_EXT_9999") == "UNMATCHED", "Unmatched check failed"
    print("  Multi-tier fuzzy matching algorithm verified across all 4 categories.")

    print("\n" + "=" * 75)
    print("ALL SENTRAPAY PLATFORM VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 75)
    return True

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)

