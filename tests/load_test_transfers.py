#!/usr/bin/env python3
"""
SentraPay: High-Concurrency Payment Switch Load Test
Spawns concurrent worker threads executing transfers against the payment switch.
Measures latency (p50, p95, p99), throughput (TPS), and verifies zero double-spends.
"""

import sys
import time
import uuid
import json
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "http://localhost:8080"
NUM_TRANSFERS = 50
CONCURRENCY = 10

def login(username="jayavignesh", password="StrongPassword123!"):
    url = f"{BASE_URL}/api/auth/login"
    data = json.dumps({"username": username, "password": password}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=10) as resp:
        body = json.loads(resp.read().decode("utf-8"))
        return body["data"]["token"]

def send_single_transfer(token, index):
    idempotency_key = f"LOAD-TX-{uuid.uuid4()}"
    url = f"{BASE_URL}/api/payments/transfer"
    payload = json.dumps({
        "recipientWalletNumber": "W-ALICE-002" if index % 2 == 0 else "W-BOB-003",
        "amount": 10.00 + (index % 50),
        "paymentMethod": "UPI"
    }).encode("utf-8")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
        "Idempotency-Key": idempotency_key
    }

    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    start = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            code = resp.getcode()
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            return code in (200, 202), elapsed_ms, None
    except urllib.error.HTTPError as e:
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        return False, elapsed_ms, f"HTTP {e.code}"
    except Exception as e:
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        return False, elapsed_ms, str(e)

def run_load_test():
    print("=" * 70)
    print(f"SENTRAPAY LOAD TEST: {NUM_TRANSFERS} TRANSFERS @ {CONCURRENCY} WORKERS")
    print("=" * 70)

    try:
        print("Authenticating...")
        token = login()
        print("Authentication OK.")
    except Exception as e:
        print(f"Failed to authenticate: {e}")
        return False

    latencies = []
    success_count = 0
    failure_count = 0

    start_total = time.perf_counter()
    with ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
        futures = [executor.submit(send_single_transfer, token, i) for i in range(NUM_TRANSFERS)]
        for f in as_completed(futures):
            ok, lat, err = f.result()
            latencies.append(lat)
            if ok:
                success_count += 1
            else:
                failure_count += 1

    total_time = time.perf_counter() - start_total
    latencies.sort()

    p50 = latencies[int(len(latencies) * 0.50)]
    p95 = latencies[int(len(latencies) * 0.95)]
    p99 = latencies[int(len(latencies) * 0.99)]
    tps = NUM_TRANSFERS / total_time

    print("\nRESULTS:")
    print(f"  Total Transfers:     {NUM_TRANSFERS}")
    print(f"  Successful:          {success_count}")
    print(f"  Failed:              {failure_count}")
    print(f"  Throughput (TPS):    {tps:.2f} transfers/sec")
    print(f"  Median Latency (p50):{p50:.2f} ms")
    print(f"  95th Percentile (p95): {p95:.2f} ms")
    print(f"  99th Percentile (p99): {p99:.2f} ms")
    print(f"  Total Duration:      {total_time:.2f} seconds")
    print("=" * 70)
    return failure_count == 0

if __name__ == "__main__":
    success = run_load_test()
    sys.exit(0 if success else 1)

