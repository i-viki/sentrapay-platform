"""
SentraPay ML Training Pipeline - Step 2: Model Trainer & Pipeline Serializer
Trains a high-performance LightGBM Gradient Boosted Decision Tree (GBDT) pipeline
using Out-Of-Time (OOT) temporal validation (zero data leakage) and scale_pos_weight
for the 2.5% fraud class imbalance.
"""

from pathlib import Path
import pandas as pd
import numpy as np
import joblib

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    average_precision_score
)

import lightgbm as lgb

# Paths
BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "synthetic_transactions.csv"
MODEL_INFERENCE_DIR = BASE_DIR.parent
PRIMARY_MODEL_PATH = MODEL_INFERENCE_DIR / "transaction_fraud_model.pkl"
BACKUP_MODEL_PATH = BASE_DIR / "transaction_fraud_model.pkl"

if not DATASET_PATH.exists():
    raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}. Run '01_generate_synthetic_dataset.py' first.")

print(f"Loading chronological dataset from {DATASET_PATH}...")
df = pd.read_csv(DATASET_PATH)

# Sort by timestamp to enforce temporal causality
if "timestamp" in df.columns:
    df = df.sort_values(by="timestamp").reset_index(drop=True)
    df_features = df.drop(columns=["timestamp", "is_fraud"])
else:
    df_features = df.drop(columns=["is_fraud"])

y = df["is_fraud"]

numeric_features = [
    "amount",
    "sender_txn_count_10m",
    "receiver_txn_count_10m",
    "minutes_since_last_txn",
    "location_changed",
    "transaction_hour"
]

categorical_features = [
    "transaction_type",
    "payment_method"
]

# --------------------------------------------------
# Out-Of-Time (OOT) Temporal Split (Zero Data Leakage)
# --------------------------------------------------
split_idx = int(len(df) * 0.80)
X_train = df_features.iloc[:split_idx]
y_train = y.iloc[:split_idx]
X_test = df_features.iloc[split_idx:]
y_test = y.iloc[split_idx:]

print(f"OOT Temporal Split (Chronological Walk-Forward):")
print(f"  Training Window: {len(X_train)} records (Fraud: {int(y_train.sum())}, Rate: {y_train.mean()*100:.2f}%)")
print(f"  Out-Of-Time Test: {len(X_test)} records (Fraud: {int(y_test.sum())}, Rate: {y_test.mean()*100:.2f}%)")

# Preprocessor: 1-hot for categories, passthrough for numerics (14 dimensions total)
preprocessor = ColumnTransformer(
    transformers=[
        ("categorical", OneHotEncoder(handle_unknown="ignore"), categorical_features),
        ("numeric", "passthrough", numeric_features)
    ]
)

# Calculate exact imbalance ratio for scale_pos_weight
neg_count = len(y_train) - y_train.sum()
pos_count = y_train.sum()
pos_weight = float(neg_count / max(1, pos_count))

print(f"Configuring LightGBM with scale_pos_weight={pos_weight:.2f}...")

classifier = lgb.LGBMClassifier(
    n_estimators=200,
    learning_rate=0.04,
    num_leaves=31,
    max_depth=8,
    scale_pos_weight=pos_weight,
    random_state=42,
    verbosity=-1,
    n_jobs=1  # Pinned to single-thread for zero-overhead real-time inference
)

model = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("classifier", classifier)
    ]
)

print("\nTraining LightGBM model pipeline...")
model.fit(X_train, y_train)

# Predictions & Metrics
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

print("\n========== OUT-OF-TIME (OOT) CLASSIFICATION REPORT ==========")
print(classification_report(y_test, y_pred, target_names=["Legitimate", "Fraud"], zero_division=0))

print("========== CONFUSION MATRIX ==========")
print(confusion_matrix(y_test, y_pred))

roc_auc = roc_auc_score(y_test, y_prob)
pr_auc = average_precision_score(y_test, y_prob)
print(f"\nROC-AUC Score:          {roc_auc:.4f}")
print(f"Average Precision (PR): {pr_auc:.4f}")

# Feature Importance Ranking
feature_names = model.named_steps["preprocessor"].get_feature_names_out()
importances = model.named_steps["classifier"].feature_importances_

# Normalize to sum to 1.0 for explainability weighting
norm_importances = importances / max(1.0, float(importances.sum()))

importance_df = pd.DataFrame({
    "feature": feature_names,
    "raw_split_count": importances,
    "relative_importance": norm_importances
}).sort_values(by="relative_importance", ascending=False)

print("\n========== TOP 10 IMPORTANT FEATURES ==========")
print(importance_df.head(10).to_string(index=False))

# Serialize model artifact
artifact = {
    "model": model,
    "features": list(df_features.columns),
    "numeric_features": numeric_features,
    "categorical_features": categorical_features,
    "feature_importances": dict(zip(feature_names, norm_importances)),
    "engine": "LightGBM",
    "training_type": "synthetic_oot_temporal",
    "roc_auc": round(roc_auc, 4),
    "pr_auc": round(pr_auc, 4)
}

joblib.dump(artifact, PRIMARY_MODEL_PATH)
joblib.dump(artifact, BACKUP_MODEL_PATH)

print(f"\nModel artifact successfully saved:")
print(f"  Primary: {PRIMARY_MODEL_PATH}")
print(f"  Backup:  {BACKUP_MODEL_PATH}")
