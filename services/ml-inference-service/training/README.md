# SentraPay Fraud Detection Model - Training & Evaluation Pipeline

This directory contains the production-grade Machine Learning training pipeline used to generate and evaluate `transaction_fraud_model.pkl` for the SentraPay ML Inference Service, utilizing the **LightGBM** gradient boosted decision tree engine and **Out-Of-Time (OOT) temporal validation**.

---

## Pipeline Overview

```
                      +---------------------------------------+
                      |  01_generate_synthetic_dataset.py     |
                      |  - 20,000 temporal transactions       |
                      |  - Chronological 30-day epoch stream  |
                      |  - 2.5% base fraud rate               |
                      +---------------------------------------+
                                          |
                                          v
                              synthetic_transactions.csv
                                          |
                                          v
                      +---------------------------------------+
                      |  02_train_fraud_model.py              |
                      |  - OOT Walk-Forward Split (80/20)     |
                      |  - LightGBM GBDT (scale_pos_weight)   |
                      |  - 90% artifact size reduction        |
                      +---------------------------------------+
                                          |
                                          v
                            transaction_fraud_model.pkl (694 KB)
                                          |
                                          v
                      +---------------------------------------+
                      |  03_evaluate_thresholds.py            |
                      |  - Financial Cost Matrix              |
                      |  - Evaluates Net Fiat Currency Loss   |
                      |  - Proves 0.25 vs 0.70 risk tiers     |
                      +---------------------------------------+
```

---

## File Structure

| Script / File | Description |
| :--- | :--- |
| `01_generate_synthetic_dataset.py` | Synthesizes 20,000 transactions ordered chronologically across 30 days using financial statistical distributions. |
| `02_train_fraud_model.py` | Trains a **LightGBM** Gradient Boosted Tree model with Out-Of-Time temporal validation (zero data leakage) and serializes the 694 KB artifact. |
| `03_evaluate_thresholds.py` | Evaluates decision cutoffs against a **Financial Loss Matrix** ($\text{Loss} = \text{FN} \times \text{amount} + \text{FP} \times \text{friction}$). |
| `synthetic_transactions.csv` | Chronological dataset of 20,000 transaction records with timestamps and labels. |

---

## Performance Benchmark

- **Model Engine**: LightGBM GBDT (200 trees, `scale_pos_weight=38.51`)
- **Model Artifact Size**: **694 KB** (down from 7.2 MB, a **90.4% reduction**)
- **Single-Request Inference Latency**: **1.4ms – 1.7ms** (down from 147ms, a **87x speedup**)
- **Out-Of-Time ROC-AUC**: **0.9839**
- **Average Precision (PR-AUC)**: **0.8194**

---

## Financial Cost Matrix Calibration

| Cutoff | Precision | Recall | False Positives | Missed Fraud | Fraud Loss (INR) | Total Cost (INR) | Assigned Action Tier |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **0.10** | 31.5% | 99.0% | 198 | 1 | INR 4,586 | INR 10,911 | ALERT_MONITOR |
| **0.25** | 41.3% | 87.4% | 128 | 13 | INR 47,318 | INR 50,518 | **MANUAL_REVIEW** |
| **0.50** | 52.7% | 84.5% | 78 | 16 | INR 51,800 | INR 53,750 | **STEP_UP_2FA** |
| **0.70** | 61.9% | 80.6% | 51 | 20 | INR 62,868 | INR 64,143 | **AUTO_REJECT (Saga)** |
| **0.90** | 81.1% | 70.9% | 17 | 30 | INR 86,613 | INR 87,038 | CRITICAL_BLOCK |

---

## How to Retrain and Evaluate

Inside the container or python environment:

```bash
# 1. Regenerate chronological dataset
python 01_generate_synthetic_dataset.py

# 2. Retrain LightGBM model and export .pkl
python 02_train_fraud_model.py

# 3. Compute financial loss trade-offs
python 03_evaluate_thresholds.py
```
