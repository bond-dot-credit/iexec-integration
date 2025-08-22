# TEE Simulation Guide - iExec Scoring Logic iApp

This guide explains how the iExec Trusted Execution Environment (TEE) simulation works and how to run it locally for testing secure scoring logic.

## Overview

This iApp demonstrates **confidential computing** using iExec's TEE framework:
- **Encrypts** sensitive input data (integer A) 
- **Processes** data securely inside TEE environment
- **Applies** scoring logic: `result = A * 2`
- **Returns** unencrypted results while keeping inputs confidential

## How TEE Simulation Works

### Environment Detection

The app detects TEE execution through iExec-specific environment variables:

```python
# TEE Environment Variables (set by iExec framework)
IEXEC_OUT = os.getenv('IEXEC_OUT')          # Output directory
IEXEC_IN = os.getenv('IEXEC_IN')            # Input directory  
IEXEC_DATASET_FILENAME = os.getenv('IEXEC_DATASET_FILENAME')  # Protected data file
```

### Data Protection Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Input Data    │───▶│  Borsh Serialize │───▶│  ZIP Encryption │
│   (Integer A)   │    │   + Encrypt      │    │   Mock Storage  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   TEE App       │◀───│  MEDPRIVATE Key  │◀───│  Protected Data │
│   Processing    │    │   Decryption     │    │   (Encrypted)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Scoring Logic │───▶│   A * 2 = Result │───▶│   JSON Output   │
│   (Confidential)│    │   (In TEE)       │    │   (Unencrypted) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Prerequisites

1. **Docker** installed and running
2. **iApp CLI** installed (`npm install -g @iexec/iapp`)
3. **Python 3.13+** (for local development)
4. **Node.js 18+** (for DataProtector integration)

## Quick Start

### 1. Clone and Setup

```bash
cd /path/to/scoringlogic
ls -la  # Should see: src/, mock/, ts-dataprotector/, iapp.config.json, etc.
```

### 2. Test TEE Simulation (Two Modes)

#### Mode A: Command Line Arguments (Development)
```bash
iapp test --args 5
```

**Expected Output:**
```json
{
  "input_A": 5,
  "scoring_logic": "A * 2",
  "result": 10,
  "status": "success",
  "data_source": "command_line_args"
}
```

#### Mode B: Protected Data (Production Simulation)
```bash
iapp test --protectedData
```

**Expected Output:**
```json
{
  "scoring_logic": "A * 2",
  "result": 14,
  "status": "success",
  "data_source": "protected_data"
}
```

**🔒 Security Note:** Input value `A=7` is **never exposed** in protected data mode!

### 3. Custom Protected Data Testing

#### Create Custom Mock Data:
```bash
python3 create_mock_data.py
# Creates mock/protectedData/scoring_mock with A=5
```

#### Test with Custom Mock:
```bash
iapp test --protectedData scoring_mock
```

**Expected Output:**
```json
{
  "scoring_logic": "A * 2", 
  "result": 10,
  "status": "success",
  "data_source": "protected_data"
}
```

## Understanding the Code

### Main Application (`src/app.py`)

```python
try:
    # Try to decrypt from protected data (TEE mode)
    protected_integer_A = protected_data.getValue('A', 'i128')
    used_protected_data = True
    print("Successfully decrypted integer A from protected data")
except Exception as e:
    # Fallback to command line args (testing mode)
    protected_integer_A = int(sys.argv[0])
    used_protected_data = False
    
# Apply scoring logic in both modes
result = protected_integer_A * 2

# Different outputs for security
if used_protected_data:
    output = {
        "scoring_logic": "A * 2",
        "result": result,
        "status": "success", 
        "data_source": "protected_data"
        # Note: input_A is NOT included for security
    }
else:
    output = {
        "input_A": protected_integer_A,  # Safe to expose in test mode
        "scoring_logic": "A * 2",
        "result": result,
        "status": "success",
        "data_source": "command_line_args"
    }
```

### Protected Data Handler (`src/protected_data.py`)

```python
def getValue(path: str, schema: str):
    # Get iExec environment paths
    IEXEC_IN = os.getenv('IEXEC_IN')
    IEXEC_DATASET_FILENAME = os.getenv('IEXEC_DATASET_FILENAME')
    
    # Open encrypted ZIP archive 
    dataset_file_path = os.path.join(IEXEC_IN, IEXEC_DATASET_FILENAME)
    
    with zipfile.ZipFile(dataset_file_path, 'r') as zipf:
        with zipf.open(file_path) as file:
            file_bytes = file.read()
    
    # Deserialize with borsh (handles MEDPRIVATE key decryption)
    if schema == 'i128':
        return I128.parse(file_bytes)
```

## Mock Data Structure

The protected data mocks are ZIP files containing borsh-serialized integers:

```bash
# Default mock (A=7)
mock/protectedData/default
├── A  # Contains borsh-serialized integer 7

# Custom mock (A=5) 
mock/protectedData/scoring_mock
├── A  # Contains borsh-serialized integer 5
```

## TEE Environment Variables

When `iapp test --protectedData` runs, these variables are automatically set:

```bash
IEXEC_OUT=/iexec_out                    # Output directory
IEXEC_IN=/iexec_in                      # Input directory  
IEXEC_DATASET_FILENAME=protectedData    # Protected data file name
```

## Security Features Demonstrated

### ✅ Input Protection
- Protected data inputs are **never exposed** in outputs
- Clear distinction between test mode (visible inputs) and secure mode (hidden inputs)

### ✅ Data Source Tracking  
- `"data_source": "protected_data"` vs `"command_line_args"`
- Always know if you're processing sensitive vs test data

### ✅ Encryption/Decryption
- Borsh serialization for secure data parsing
- ZIP archive encryption simulation
- MEDPRIVATE key handling (simulated locally, real in production)

### ✅ TEE Simulation
- Docker container isolation
- iExec environment variable simulation
- Deterministic output generation

## Advanced Testing

### DataProtector Integration (TypeScript)

The repository includes a complete TypeScript implementation for managing encrypted credit score data:

```bash
cd ts-dataprotector
npm install
cp .env.example .env
# Edit .env with your wallet details

# Protect credit score data
npm run protect-data

# Grant access to users/apps
npm run grant-access <protected-data-address> <user-address> <app-address>

# Run comprehensive tests
npm run test
```

### Production Deployment

```bash
# Deploy to iExec decentralized platform
iapp deploy

# Run on real TEE workers with protected data
iapp run <iapp-address> --protectedData <protected-data-address>
```

## Troubleshooting

### Common Issues

1. **"Missing protected data" error**
   - Use `--args` or `--protectedData` flag
   - Check mock data exists in `mock/protectedData/`

2. **Docker build failures**
   - Ensure Docker daemon is running
   - Check Python 3.13.3 base image availability

3. **Permission errors**
   - Ensure write access to `output/` directory
   - Check Docker has proper permissions

### Debug Output

Add logging to see TEE detection:

```python
def is_running_in_tee():
    has_iexec_out = os.getenv('IEXEC_OUT') is not None
    has_iexec_in = os.getenv('IEXEC_IN') is not None  
    has_dataset = os.getenv('IEXEC_DATASET_FILENAME') is not None
    
    print(f"TEE Detection - OUT: {has_iexec_out}, IN: {has_iexec_in}, DATASET: {has_dataset}")
    return has_iexec_out and has_iexec_in and has_dataset
```

## Production vs Simulation

| Feature | Local Simulation | Production TEE |
|---------|------------------|----------------|
| **Environment** | Docker container | iExec SGX worker |
| **Data Encryption** | Mock ZIP files | Real DataProtector encryption |
| **MEDPRIVATE Key** | Simulated decryption | Real SGX key handling |
| **Network** | Local | Decentralized iExec network |
| **Trust Model** | Developer machine | Hardware-enforced SGX |

## Next Steps

1. **Test both modes** to understand the security model
2. **Create custom mocks** with different input values
3. **Deploy to iExec** for real TEE execution  
4. **Integrate DataProtector** for production data management
5. **Build your scoring logic** on this foundation

This simulation provides a complete local development environment for confidential computing applications before deploying to iExec's decentralized TEE network.