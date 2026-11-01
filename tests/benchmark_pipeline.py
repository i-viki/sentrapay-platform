import urllib.request
import urllib.error
import json
import time
import uuid

BASE_URL = "http://localhost:8080"

def make_request(path, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{path}"
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=req_headers, method=method)
    try:
        t0 = time.time()
        with urllib.request.urlopen(req, timeout=10) as resp:
            t1 = time.time()
            return resp.getcode(), json.loads(resp.read().decode("utf-8")), (t1 - t0) * 1000
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = raw
        return e.code, parsed, 0

# 1. Login
status, auth_res, _ = make_request("/api/auth/login", method="POST", data={
    "username": "jayavignesh",
    "password": "StrongPassword123!"
})
token = auth_res["data"]["token"]
auth_headers = {"Authorization": f"Bearer {token}"}
print(f"Authenticated as jayavignesh.")

# 2. Benchmark transfer POST
idemp = f"bench-{uuid.uuid4()}"
transfer_headers = {
    **auth_headers,
    "Idempotency-Key": idemp
}
transfer_payload = {
    "recipientWalletNumber": "W-ALICE-002",
    "amount": 100.00,
    "currency": "INR",
    "narration": "Benchmark Latency Test"
}

t_start = time.time()
status, res, post_ms = make_request("/api/payments/transfer", method="POST", data=transfer_payload, headers=transfer_headers)
print(f"POST /api/payments/transfer returned HTTP {status} in {post_ms:.2f} ms")
data_obj = res.get("data", {})
ref = data_obj.get("paymentReference") or data_obj.get("reference")
print(f"Payment Reference: {ref}, Initial Status: {data_obj.get('status')}")

# 3. Poll /api/payments/{ref} to see when it transitions to SETTLED
for i in range(100):
    time.sleep(0.01) # 10ms poll
    status, ref_res, query_ms = make_request(f"/api/payments/{ref}", headers=auth_headers)
    if status == 200:
        current_data = ref_res.get("data", {})
        curr_status = current_data.get("status")
        if curr_status in ["SETTLED", "REJECTED", "FAILED"]:
            total_ms = (time.time() - t_start) * 1000
            print(f"Transfer transitioned to [{curr_status}] in total: {total_ms:.2f} ms (query latency: {query_ms:.2f} ms)")
            print(f"Risk Score: {current_data.get('riskScore')}, Risk Tier: {current_data.get('riskTier')}")
            break
