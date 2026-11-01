-- =============================================================================
-- SentraPay Core Financial Database Schema (PostgreSQL 14+ Dialect)
-- Author: Jayavignesh (jayavignesh.dev)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. USERS & ROLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20) NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER', -- 'USER', 'ADMIN', 'COMPLIANCE_OFFICER'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- -----------------------------------------------------------------------------
-- 2. WALLETS & BALANCE HOLDS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    wallet_number VARCHAR(64) NOT NULL UNIQUE,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'FROZEN', 'SUSPENDED'
    initial_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    version BIGINT NOT NULL DEFAULT 0,            -- Optimistic locking counter
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_number ON wallets(wallet_number);

CREATE TABLE IF NOT EXISTS balance_holds (
    id BIGSERIAL PRIMARY KEY,
    wallet_id BIGINT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    payment_reference VARCHAR(64) NOT NULL UNIQUE,
    hold_amount NUMERIC(15, 2) NOT NULL CHECK (hold_amount > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'COMMITTED', 'RELEASED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_holds_wallet_status ON balance_holds(wallet_id, status);

-- -----------------------------------------------------------------------------
-- 3. TRANSACTIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    payment_reference VARCHAR(64) NOT NULL UNIQUE,
    idempotency_key VARCHAR(64) NOT NULL UNIQUE,
    sender_wallet_id BIGINT NOT NULL REFERENCES wallets(id),
    recipient_wallet_id BIGINT NOT NULL REFERENCES wallets(id),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    payment_channel VARCHAR(50) NOT NULL DEFAULT 'WALLET_TRANSFER',
    status VARCHAR(50) NOT NULL DEFAULT 'INITIATED', -- 'INITIATED', 'HOLD_APPLIED', 'SETTLED', 'FAILED', 'MANUAL_REVIEW'
    risk_score NUMERIC(5, 4) NULL,
    risk_tier VARCHAR(20) NULL,
    claimed_utr VARCHAR(100) NULL,
    failure_reason VARCHAR(255) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tx_payment_ref ON transactions(payment_reference);
CREATE INDEX IF NOT EXISTS idx_tx_idempotency ON transactions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_tx_sender ON transactions(sender_wallet_id);
CREATE INDEX IF NOT EXISTS idx_tx_recipient ON transactions(recipient_wallet_id);
CREATE INDEX IF NOT EXISTS idx_tx_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_tx_claimed_utr ON transactions(claimed_utr);

-- -----------------------------------------------------------------------------
-- 4. DOUBLE-ENTRY GENERAL LEDGER (CORE FINANCIAL INTEGRITY)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ledger_accounts (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE, -- '1010-CASH', '2010-WALLET-LIABILITY', '4010-FEE-REVENUE'
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,        -- 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id BIGSERIAL PRIMARY KEY,
    entry_number VARCHAR(64) NOT NULL UNIQUE,
    transaction_id BIGINT NOT NULL REFERENCES transactions(id),
    description VARCHAR(255) NOT NULL,
    total_debit NUMERIC(15, 2) NOT NULL,
    total_credit NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_balanced_entry CHECK (total_debit = total_credit)
);

CREATE INDEX IF NOT EXISTS idx_journal_tx ON journal_entries(transaction_id);

CREATE TABLE IF NOT EXISTS journal_lines (
    id BIGSERIAL PRIMARY KEY,
    journal_entry_id BIGINT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id BIGINT NOT NULL REFERENCES ledger_accounts(id),
    entry_type VARCHAR(10) NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    memo VARCHAR(255) NULL
);

CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON journal_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_entry ON journal_lines(journal_entry_id);

-- -----------------------------------------------------------------------------
-- 5. BANK STATEMENTS & UTR RECONCILIATION
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bank_statements (
    id BIGSERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_hash_sha256 VARCHAR(64) NOT NULL UNIQUE,
    source_channel VARCHAR(50) NOT NULL, -- 'HDFC_BANK', 'GPAY_BUSINESS', 'RAZORPAY'
    total_records INT NOT NULL DEFAULT 0,
    matched_records INT NOT NULL DEFAULT 0,
    unmatched_records INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'PROCESSING', -- 'PROCESSING', 'COMPLETED', 'FAILED'
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS statement_records (
    id BIGSERIAL PRIMARY KEY,
    statement_id BIGINT NOT NULL REFERENCES bank_statements(id) ON DELETE CASCADE,
    utr_number VARCHAR(100) NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    payer_vpa VARCHAR(100) NULL,
    is_reconciled BOOLEAN NOT NULL DEFAULT FALSE,
    match_type VARCHAR(50) DEFAULT 'UNMATCHED',
    confidence_score NUMERIC(5, 2) DEFAULT 0.00,
    discrepancy_reason VARCHAR(255) NULL,
    reconciled_transaction_id BIGINT NULL REFERENCES transactions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stmt_records_utr ON statement_records(utr_number);
CREATE INDEX IF NOT EXISTS idx_stmt_records_reconciled ON statement_records(is_reconciled);

-- -----------------------------------------------------------------------------
-- 5B. BENEFICIARIES & P2P PAYMENT REQUESTS (EXPANDED FINTECH FEATURES)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS beneficiaries (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    beneficiary_name VARCHAR(100) NOT NULL,
    recipient_wallet_number VARCHAR(64) NOT NULL,
    cooling_off_until TIMESTAMP WITH TIME ZONE NOT NULL,
    daily_limit NUMERIC(15, 2) NOT NULL DEFAULT 50000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_beneficiaries_user ON beneficiaries(user_id);

CREATE TABLE IF NOT EXISTS payment_requests (
    id BIGSERIAL PRIMARY KEY,
    request_reference VARCHAR(64) NOT NULL UNIQUE,
    requester_wallet_id BIGINT NOT NULL REFERENCES wallets(id),
    payer_wallet_id BIGINT NOT NULL REFERENCES wallets(id),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    description VARCHAR(255) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    fulfilled_payment_reference VARCHAR(64) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_requests_payer ON payment_requests(payer_wallet_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_requester ON payment_requests(requester_wallet_id);

-- -----------------------------------------------------------------------------
-- 6. TAMPER-EVIDENT HASH-CHAINED AUDIT TRAIL
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action_type VARCHAR(50) NOT NULL,
    entity_name VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    performed_by BIGINT NULL REFERENCES users(id),
    ip_address VARCHAR(45) NULL,
    log_payload TEXT NOT NULL,
    previous_hash VARCHAR(64) NOT NULL,
    record_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_name, entity_id);

-- -----------------------------------------------------------------------------
-- SEED DATA: LEDGER CHART OF ACCOUNTS & INITIAL DEMO USERS
-- -----------------------------------------------------------------------------
INSERT INTO ledger_accounts (code, name, type) VALUES
('1010', 'Central Escrow Cash Account', 'ASSET'),
('1020', 'Bank Settlement Inward Clearing', 'ASSET'),
('2010', 'User Wallet Balances (Liability)', 'LIABILITY'),
('2020', 'Active Balance Holds (Liability)', 'LIABILITY'),
('3010', 'Operational Reserves', 'EQUITY'),
('4010', 'Payment Processing Fee Revenue', 'REVENUE'),
('5010', 'Network & Gateway Clearing Expenses', 'EXPENSE')
ON CONFLICT (code) DO NOTHING;

-- Demo Users (BCrypt password: StrongPassword123!)
-- Hash: $2a$10$oj98VolN9J6m.mfmDFkHpeUDV15jZIKgDbmPQ1dOwJ8JgO.O9NB6K
INSERT INTO users (id, username, email, password_hash, full_name, phone_number, role) VALUES
(1, 'jayavignesh', 'jayavignesh324@gmail.com', '$2a$10$oj98VolN9J6m.mfmDFkHpeUDV15jZIKgDbmPQ1dOwJ8JgO.O9NB6K', 'Jayavignesh', '+919876543210', 'ADMIN'),
(2, 'alice', 'alice@sentrapay.dev', '$2a$10$oj98VolN9J6m.mfmDFkHpeUDV15jZIKgDbmPQ1dOwJ8JgO.O9NB6K', 'Alice Johnson', '+919876543211', 'USER'),
(3, 'bob', 'bob@sentrapay.dev', '$2a$10$oj98VolN9J6m.mfmDFkHpeUDV15jZIKgDbmPQ1dOwJ8JgO.O9NB6K', 'Bob Smith', '+919876543212', 'USER')
ON CONFLICT (id) DO NOTHING;

-- Demo Wallets with funded initial balances
INSERT INTO wallets (id, user_id, wallet_number, currency, initial_balance, status) VALUES
(1, 1, 'W-JAYAVIGNESH-001', 'INR', 100000.00, 'ACTIVE'),
(2, 2, 'W-ALICE-002', 'INR', 25000.00, 'ACTIVE'),
(3, 3, 'W-BOB-003', 'INR', 15000.00, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('wallets_id_seq', (SELECT MAX(id) FROM wallets));

-- Demo Beneficiaries
INSERT INTO beneficiaries (id, user_id, beneficiary_name, recipient_wallet_number, cooling_off_until, daily_limit) VALUES
(1, 1, 'Alice Trusted Merchant', 'W-ALICE-002', CURRENT_TIMESTAMP - INTERVAL '2 days', 50000.00),
(2, 2, 'Bob Supplier', 'W-BOB-003', CURRENT_TIMESTAMP - INTERVAL '1 day', 25000.00),
(3, 1, 'Bob Demo Payee (Cooling Off)', 'W-BOB-003', CURRENT_TIMESTAMP + INTERVAL '20 hours', 5000.00)
ON CONFLICT (id) DO NOTHING;

-- Demo Payment Request
INSERT INTO payment_requests (id, request_reference, requester_wallet_id, payer_wallet_id, amount, currency, description, status, expires_at) VALUES
(1, 'REQ-DEMO-001', 2, 1, 750.00, 'INR', 'Client Lunch Reimbursement', 'PENDING', CURRENT_TIMESTAMP + INTERVAL '12 hours')
ON CONFLICT (id) DO NOTHING;

SELECT setval('beneficiaries_id_seq', (SELECT MAX(id) FROM beneficiaries));
SELECT setval('payment_requests_id_seq', (SELECT MAX(id) FROM payment_requests));

