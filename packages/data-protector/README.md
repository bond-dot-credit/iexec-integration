# Data Protector Package

Simple utilities for managing protected data with iExec DataProtector.

## 🎯 Core Functions

### 1. Upload Protected Data
Encrypts and uploads credit score data to iExec's protected storage.

```bash
npm run protect
```

### 2. Retrieve Protected Data
Fetches information about protected data (metadata only, not the encrypted content).

```bash
npm run retrieve <protected-data-address>
```

### 3. Grant Access
Grants access permissions to users and applications.

```bash
npm run grant-access <protected-data-address> <user-address> <app-address> [price] [accesses]
```

## 📋 Usage Examples

### Protect Data
```bash
# Protect credit score data from environment variables
# Make sure AGENT_ID and CREDIT_SCORE are set in .env
npm run protect
```

### Retrieve Data Info
```bash
# Get information about protected data
npm run retrieve 0xedEE98aA169B6685625c7a8b5bd5C8ece41B4BB6
```

### Grant Access
```bash
# Grant free access to TEE app
npm run grant-access 0xedEE98aA169B6685625c7a8b5bd5C8ece41B4BB6 0xa5EBd895c62fB917d97C6F3E39A4562F1BE5CEee 0x5eC82059CbF38C005B73e70220a5192B19E7A12c 0 5

# Grant public access (any user)
npm run grant-access 0xedEE98aA169B6685625c7a8b5bd5C8ece41B4BB6 public 0x5eC82059CbF38C005B73e70220a5192B19E7A12c 0 100
```

## ⚙️ Configuration

Copy the example environment file and configure your values:

```bash
cp .env.example .env
```

Then edit `.env` with your wallet and credit score data:

```bash
# Wallet Configuration
PRIVATE_KEY=your_wallet_private_key_here

# Credit Score Data (Required for upload)
AGENT_ID=agent_bond_001
CREDIT_SCORE=750

# Optional Credit Score Metadata
SCORE_VERSION=2.1.0
MODEL_NAME=bond_credit_v2
CONFIDENCE=0.95
RISK_CATEGORY=low
DATA_NAME=Agent_Bond_CreditScore_Production
```

## 🔒 Security

- Private keys are loaded from environment variables
- Data is encrypted client-side before upload
- Access permissions are managed on-chain
- Only metadata is retrievable without proper access permissions

## 🏗️ Files

- `src/protectScoreData.ts` - Main data protection class
- `src/retrieveData.ts` - Data retrieval utilities  
- `src/grantAccess.ts` - Access management utilities
- `src/types.ts` - TypeScript type definitions