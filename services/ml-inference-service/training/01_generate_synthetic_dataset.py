"""
SentraPay ML Training Pipeline - Step 1: Synthetic Dataset Generator
Generates realistic financial transaction streams with temporal timestamps and
simulated fraud patterns (Lognormal amounts, Poisson velocity spikes, Exponential inter-transaction intervals).
"""

from pathlib import Path
import numpy as np
import pandas as pd

# Paths and Configuration
BASE_DIR = Path(__file__).resolve().parent
OUTPUT_PATH = BASE_DIR / "synthetic_transactions.csv"

TOTAL_TRANSACTIONS = 20000
FRAUD_RATE = 0.025  # 2.5% base fraud rate for imbalanced class modeling

rng = np.random.default_rng(42)

# Generate simulated target labels (0 = Legitimate, 1 = Fraud)
is_fraud = rng.binomial(1, FRAUD_RATE, TOTAL_TRANSACTIONS)

# --------------------------------------------------
# Feature Generation
# --------------------------------------------------

# 1. Transaction Amount (INR): Lognormal distribution
amount = np.where(
    is_fraud == 1,
    rng.lognormal(mean=8.0, sigma=1.0, size=TOTAL_TRANSACTIONS),
    rng.lognormal(mean=7.0, sigma=1.0, size=TOTAL_TRANSACTIONS)
)
amount = np.clip(amount, 10, 200000)
amount = np.round(amount, 2)

# 2. Categorical Channels
transaction_types = np.array(["TRANSFER", "PAYMENT", "WITHDRAWAL", "DEPOSIT"])
payment_methods = np.array(["UPI", "CARD", "BANK_TRANSFER", "WALLET"])

transaction_type = []
payment_method = []

for fraud in is_fraud:
    if fraud == 1:
        transaction_type.append(rng.choice(transaction_types, p=[0.50, 0.20, 0.25, 0.05]))
        payment_method.append(rng.choice(payment_methods, p=[0.50, 0.25, 0.15, 0.10]))
    else:
        transaction_type.append(rng.choice(transaction_types, p=[0.35, 0.35, 0.15, 0.15]))
        payment_method.append(rng.choice(payment_methods, p=[0.40, 0.25, 0.20, 0.15]))

# 3. Velocity Features (10-minute sliding windows)
sender_txn_count_10m = np.where(
    is_fraud == 1,
    rng.poisson(4.0, TOTAL_TRANSACTIONS),
    rng.poisson(1.2, TOTAL_TRANSACTIONS)
)

receiver_txn_count_10m = np.where(
    is_fraud == 1,
    rng.poisson(2.5, TOTAL_TRANSACTIONS),
    rng.poisson(0.8, TOTAL_TRANSACTIONS)
)

# 4. Inter-Transaction Gap (Minutes since previous transaction)
minutes_since_last_txn = np.where(
    is_fraud == 1,
    rng.exponential(25, TOTAL_TRANSACTIONS),
    rng.exponential(180, TOTAL_TRANSACTIONS)
)
minutes_since_last_txn = np.round(np.clip(minutes_since_last_txn, 0.1, 1440), 2)

# 5. Geolocation Change (Impossible travel indicator)
location_changed = np.where(
    is_fraud == 1,
    rng.binomial(1, 0.35, TOTAL_TRANSACTIONS),
    rng.binomial(1, 0.04, TOTAL_TRANSACTIONS)
)

# 6. Temporal Sequence (Simulating 30 days of chronological payment switch stream)
base_epoch = 1761955200  # Start timestamp
timestamp_seconds = np.sort(rng.integers(base_epoch, base_epoch + 30 * 86400, TOTAL_TRANSACTIONS))
transaction_hour = (timestamp_seconds % 86400) // 3600

# --------------------------------------------------
# Assembly & Export
# --------------------------------------------------

df = pd.DataFrame({
    "timestamp": timestamp_seconds,
    "amount": amount,
    "transaction_type": transaction_type,
    "payment_method": payment_method,
    "sender_txn_count_10m": sender_txn_count_10m,
    "receiver_txn_count_10m": receiver_txn_count_10m,
    "minutes_since_last_txn": minutes_since_last_txn,
    "location_changed": location_changed,
    "transaction_hour": transaction_hour,
    "is_fraud": is_fraud
})

# Chronological sorting for Out-Of-Time (OOT) temporal validation
df = df.sort_values(by="timestamp").reset_index(drop=True)

df.to_csv(OUTPUT_PATH, index=False)
print(f"Synthetic dataset created successfully: {OUTPUT_PATH}")
print(f"Shape: {df.shape}, Fraud cases: {int(df['is_fraud'].sum())} ({df['is_fraud'].mean()*100:.2f}%)")
