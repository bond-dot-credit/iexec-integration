# iExec Scoring Logic - Decentralized Confidential Computing

A complete implementation of secure credit score processing using iExec's Trusted Execution Environment (TEE) with React frontend, DataProtector encryption, and production deployment tools.

## 🏗️ Repository Structure

```
scoringlogic/
├── packages/
│   ├── tee-app/          # Python TEE application (Docker containerized)
│   ├── frontend/         # React frontend with MetaMask integration
│   ├── data-protector/   # DataProtector encryption utilities
│   └── deployment/       # Testing and deployment scripts
├── docs/                 # Consolidated documentation
├── .env.example         # Environment configuration template
└── package.json         # Monorepo configuration
```

## 🚀 Quick Start

### Setup Environment
```bash
# Copy environment template and configure
cp .env.example .env
# Edit .env with your wallet private key and data
```

### Install Dependencies
```bash
npm run install:all
```

### Start Development
```bash
# Start React frontend
npm run start:frontend

# Test TEE execution
npm run test:tee
```

### Deploy & Production
```bash
# Deploy TEE app to iExec
npm run deploy:tee

# Protect data with encryption
npm run protect-data

# Retrieve data information
npm run retrieve-data <protected-data-address>

# Grant access permissions
npm run grant-access <data-addr> <user-addr> <app-addr>
```

## 📦 Packages

### 1. TEE App (`packages/tee-app/`)
Python application running in Trusted Execution Environment:
- **Purpose**: Decrypt protected data and apply scoring logic (`A * 2`)
- **Security**: TEE execution with MEDPRIVATE key decryption
- **Tech**: Python 3.13.3, borsh serialization, iExec framework

### 2. Frontend (`packages/frontend/`)
React web application for TEE interaction:
- **Purpose**: User interface for triggering TEE tasks and viewing results
- **Features**: MetaMask integration, real-time monitoring, proof verification
- **Tech**: React 18, TypeScript, Tailwind CSS, iExec SDK

### 3. Data Protector (`packages/data-protector/`)
Encryption and access control utilities:
- **Purpose**: Encrypt sensitive data and manage permissions
- **Features**: DataProtector integration, access granting, permission management
- **Tech**: TypeScript, iExec DataProtector SDK

### 4. Deployment (`packages/deployment/`)
Testing and deployment automation:
- **Purpose**: End-to-end testing and production deployment
- **Features**: TEE workflow testing, order creation, task monitoring
- **Tech**: Node.js, iExec SDK

## 🔒 Security Model

### Data Flow
1. **Input Protection**: Agent credit scores encrypted with DataProtector
2. **TEE Execution**: Computation in isolated Trusted Execution Environment
3. **Access Control**: Blockchain-based permission management
4. **Result Privacy**: Outputs reveal computation results, not input data

### Network Configuration
- **Testnet**: iExec Bellecour (Chain ID: 134)
- **TEE App**: `0x5eC82059CbF38C005B73e70220a5192B19E7A12c`
- **Protected Data**: `0xedEE98aA169B6685625c7a8b5bd5C8ece41B4BB6`

## 📖 Documentation

- **[Project Overview](docs/CLAUDE.md)** - Complete technical documentation
- **[Frontend Integration](docs/FRONTEND_INTEGRATION_STATUS.md)** - Implementation status
- **[TEE Simulation Guide](docs/TEE_SIMULATION_GUIDE.md)** - Development testing
- **[Package READMEs](packages/)** - Individual package documentation

## 🛠️ Development

### Local Testing
```bash
# Test TEE app locally
cd packages/tee-app && iapp test --args 42

# Test with protected data
cd packages/tee-app && iapp test --protectedData

# Frontend development
cd packages/frontend && npm start
```

### Production Testing
```bash
# End-to-end TEE workflow
npm run test:tee

# Frontend with real TEE execution
npm run start:frontend
```

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` and configure:

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

## 🎯 Features

### ✅ Complete TEE Integration
- Real iExec SDK integration (not mocked)
- TEE workerpool discovery and task execution
- MetaMask wallet connection with network switching
- Real-time task monitoring and result retrieval

### ✅ Data Protection
- DataProtector encryption for sensitive inputs
- MEDPRIVATE key handling in TEE environment
- Access control with blockchain permissions
- Input privacy preservation in outputs

### ✅ Production Ready
- Deployed on iExec Bellecour testnet
- End-to-end tested with real TEE workers
- Error handling and user feedback
- Cryptographic proof verification

## 🚀 Production Status

**Status**: ✅ **PRODUCTION READY & DEPLOYED**

The application successfully demonstrates:
- **Decentralized Confidential Computing** with real TEE execution
- **Secure Credit Score Processing** with input data protection  
- **Production-Ready Architecture** with proper error handling
- **User-Friendly Interface** with MetaMask integration

Ready for real-world agent credit score processing! 🎉

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

1. Clone the repository
2. Copy environment template: `cp .env.example .env`
3. Install dependencies: `npm run install:all`
4. Start development: `npm run start:frontend`
5. Make changes and test with `npm run test:tee`
6. Submit pull request

## 🔗 Links

- [iExec Explorer](https://explorer.iex.ec/bellecour)
- [iExec Documentation](https://docs.iex.ec)
- [DataProtector Guide](https://docs.iex.ec/tools/dataprotector)