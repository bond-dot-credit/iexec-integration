# iExec DataProtector - Credit Score Integration

A **full production-ready implementation** for securely storing and managing encrypted agent credit score data using iExec's DataProtector service. This TypeScript library provides complete functionality for protecting sensitive credit data and managing granular access permissions.

## Implementation

- **Encrypt & Upload** credit score data to iExec's decentralized storage
- **Grant Access** to specific wallet addresses and app contracts
- **Manage Permissions** with flexible access control patterns
- **Revoke Access** when needed
- **Batch Operations** for managing multiple users/apps
- **Type Safety** with comprehensive TypeScript definitions

### **Core Components**

#### 1. **ScoreDataProtector** (`src/protectScoreData.ts`)
Main class for credit score data protection:
```typescript
// Encrypt and upload credit score data
const protectedData = await scoreProtector.protectCreditScore(creditScoreData);

// Grant access to specific entities
await scoreProtector.grantAccessToScore(
  protectedData.address,
  userWallet,
  appContract,
  pricePerAccess,
  numberOfAccess
);
```

#### 2. **AccessManager** (`src/grantAccess.ts`)
Advanced access control utilities:
```typescript
// Grant public access
await accessManager.grantPublicAccess(protectedDataAddress, appAddress);

// Bulk user management
await accessManager.grantAccessToMultipleUsers(protectedDataAddress, userList, appAddress);
```

#### 3. **Type System** (`src/types.ts`)
Full TypeScript definitions for:
- Credit score data structures
- API response types
- Error handling
- Batch operation results

#### 4. **Test Suite** (`src/test.ts`)
Testing framework covering:
- Data protection workflows
- Access grant scenarios
- Unauthorized access prevention
- Batch operations

## 📋 Prerequisites

- **Node.js** 16+ 
- **npm** or **yarn**
- **Ethereum wallet** with private key
- **iExec account** (optional for testnet)

## 🛠 Installation & Setup

### 1. Install Dependencies
```bash
cd ts-dataprotector
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Wallet Configuration
PRIVATE_KEY=your_ethereum_private_key_here
WALLET_ADDRESS=your_wallet_address_here

# Test Configuration  
TEST_AUTHORIZED_USER=0x1234567890123456789012345678901234567890
TEST_AUTHORIZED_APP=0x0987654321098765432109876543210987654321

# Pricing (in nRLC)
DEFAULT_PRICE_PER_ACCESS=0
DEFAULT_NUMBER_OF_ACCESS=1
```

### 3. Build Project
```bash
npm run build
```

## Usage Examples

### **Protect Credit Score Data**

```typescript
import { ScoreDataProtector, CreditScoreData } from './src';

const scoreProtector = new ScoreDataProtector();

const creditScore: CreditScoreData = {
  agentId: 'agent_12345',
  creditScore: 750,
  timestamp: Date.now(),
  scoreVersion: '2.1.0',
  metadata: {
    model: 'bond_credit_v2',
    confidence: 0.92,
    riskCategory: 'low'
  }
};

// Encrypt and upload to iExec decentralized storage
const protectedData = await scoreProtector.protectCreditScore(
  creditScore,
  'Agent_12345_CreditScore'
);

console.log('Protected Data Address:', protectedData.address);
```

### **Grant Access to Specific User & App**

```typescript
// Authorize specific wallet and app combination
await scoreProtector.grantAccessToScore(
  protectedData.address,
  '0x1234567890123456789012345678901234567890', // User wallet
  '0x9876543210987654321098765432109876543210', // App contract
  0,  // Free access
  5   // 5 access attempts
);
```

### **Grant Public Access**

```typescript
import { AccessManager } from './src';

const accessManager = new AccessManager();

// Allow anyone to access via specific app
await accessManager.grantPublicAccess(
  protectedData.address,
  '0x9876543210987654321098765432109876543210', // App contract
  10, // 10 nRLC per access
  100 // 100 total accesses
);
```

### **Batch User Management**

```typescript
const authorizedUsers = [
  '0x1111111111111111111111111111111111111111',
  '0x2222222222222222222222222222222222222222',
  '0x3333333333333333333333333333333333333333'
];

const results = await accessManager.grantAccessToMultipleUsers(
  protectedData.address,
  authorizedUsers,
  '0x9876543210987654321098765432109876543210',
  5,  // 5 nRLC per access
  3   // 3 accesses per user
);

console.log('Grant results:', results);
```

## Testing

### **Run Full Test Suite**
```bash
npm test
# or
npm run dev
```

### **Test Individual Components**

#### Test Data Protection Only:
```bash
npm run protect-data
```

#### Test Access Grants via CLI:
```bash
npm run grant-access <protected-data-address> <user-address> <app-address> [price] [accesses]

# Examples:
npm run grant-access 0xABC...123 0x123...456 0x789...012 0 5
npm run grant-access 0xABC...123 public 0x789...012 10 100
```

### **Expected Test Output**
```
Starting iExec DataProtector Test Suite
==========================================

Testing: Protect Credit Score Data
=====================================
Protecting credit score data for agent: test_agent_001
Credit score data protected successfully!
Protected Data Address: 0xabc123...

Testing: Grant Access to Authorized Entities
===============================================
Granting access to protected credit score data...
Access granted successfully!

Testing: Grant Public Access
===============================
Granting public access to protected data...
Public access test passed

```

## Architecture & Data Flow

### **Security Model**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Agent Data    │───▶│  Client-side     │───▶│  iExec Storage  │
│  (Credit Score) │    │   Encryption     │    │  (Decentralized)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Authorized    │◀───│   grantAccess    │◀───│   Data Owner    │
│   App/User      │    │   (Blockchain)   │    │   (Wallet)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   TEE Processing│───▶│   Scoring Logic  │───▶│   Results       │
│   (iExec Worker)│    │   (Python iApp)  │    │   (Unencrypted) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **Access Control Matrix**

| Entity Type | Access Method | Description | Use Case |
|-------------|---------------|-------------|----------|
| **Specific User** | `grantAccess(user, app)` | Single wallet + app combination | Individual agent access |
| **Public Access** | `grantAccess('0x0...0', app)` | Any user via specific app | Public scoring services |
| **Multiple Users** | `grantAccessToMultipleUsers()` | Batch grant to user list | Team/group access |
| **Multiple Apps** | `grantAccessToMultipleApps()` | Single user, multiple apps | Cross-platform access |
| **Unauthorized** | No grant | ❌ Cannot access encrypted data | Security enforcement |

## 🔒 Security Features

### **Data Protection**
- **Client-side Encryption**: Data encrypted before leaving your environment
- **Decentralized Storage**: Stored on iExec's distributed infrastructure
- **Zero Knowledge**: Unauthorized parties cannot view data content
- **Immutable Records**: All access grants recorded on blockchain

### **Access Control**
- **Granular Permissions**: Control exactly who can access what
- **Usage Limits**: Set number of allowed accesses per grant
- **Pricing Control**: Optional pricing per data access (in nRLC)
- **Revocation**: Remove access when needed
- **Audit Trail**: Complete history of all permissions

### **Unauthorized Access Prevention**
- **Encryption Enforcement**: Data is always encrypted at rest
- **Access Validation**: Only granted users/apps can process data in TEE
- **Smart Contract Security**: Access control enforced by blockchain
- **Zero Data Leakage**: Input data never exposed in outputs

## Implementation Status

### **Functional Implemented Features**
- [x] **Data Protection**: Complete encryption and upload to iExec
- [x] **Access Management**: Full grantAccess functionality for wallets & apps
- [x] **Batch Operations**: Multi-user and multi-app access management  
- [x] **Public Access**: Allow any user via specific apps
- [x] **Access Revocation**: Remove permissions when needed
- [x] **Error Handling**: Comprehensive error management with typed exceptions
- [x] **Type Safety**: Complete TypeScript definitions
- [x] **Testing Suite**: Full test coverage of all functionality

### **🔧 Production Considerations**

#### **Network Configuration**
- Currently configured for iExec Sidechain (testnet)
- Update `IEXEC_CHAIN_ID` in `.env` for mainnet deployment

#### **Gas & Pricing**
- Access grants require blockchain transactions (gas fees)
- Data access pricing configurable in nRLC (nano RLC)
- Consider economics for your specific use case

#### **Integration Points**
- Integrates with existing Python iApp for scoring logic
- Compatible with iExec's TEE execution environment
- Supports existing `protected_data.py` deserializer pattern

## Integration with Existing Python iApp

This TypeScript implementation complements the existing Python scoring logic:

1. **Upload Phase**: Use TypeScript to encrypt and upload credit scores
2. **Access Grant Phase**: Use TypeScript to authorize specific users/apps  
3. **Processing Phase**: Python iApp processes the protected data in TEE
4. **Results Phase**: Unencrypted results available for downstream use

## API Reference

### **ScoreDataProtector Methods**
- `protectCreditScore(data, name?)` - Encrypt and upload credit score data
- `grantAccessToScore(address, user, app, price?, accesses?)` - Grant access permissions
- `revokeAccess(grantedAccess)` - Revoke specific access grant
- `getProtectedDataInfo(address)` - Fetch protected data metadata

### **AccessManager Methods**  
- `grantPublicAccess(address, app, price?, accesses?)` - Allow public access
- `grantAccessToMultipleUsers(address, users, app, price?, accesses?)` - Bulk user grants
- `grantAccessToMultipleApps(address, user, apps, price?, accesses?)` - Bulk app grants
- `revokeMultipleAccess(grantedAccessList)` - Bulk access revocation

## 🐛 Troubleshooting

### **Common Issues**

#### "No wallet configured"
- Ensure `PRIVATE_KEY` is set in `.env`
- Check wallet has sufficient ETH for gas fees

#### "Protected data not found"
- Verify the protected data address is correct
- Check the data was successfully uploaded

#### "Access denied"
- Confirm access was properly granted to user/app combination
- Check access hasn't been revoked or expired

#### "TypeScript compilation errors"
- Run `npm run build` to check for type issues
- Ensure all dependencies are installed

### **Debug Mode**
Enable verbose logging by setting:
```env
DEBUG=true
LOG_LEVEL=debug
```

## Next Steps

1. **Deploy to Production**: Update network configuration for mainnet
2. **Monitor Usage**: Track access patterns and costs
3. **Scale Access**: Implement automated access management
4. **Analytics**: Add metrics for data usage and access patterns
5. **Integration**: Connect with your existing credit scoring pipeline

## 🔗 Related Documentation

- [iExec DataProtector Docs](https://tools.docs.iex.ec/tools/dataProtector)
- [Parent Project README](../README.md) - Python iApp scoring logic
- [iExec Protocol Docs](https://protocol.docs.iex.ec/)

---