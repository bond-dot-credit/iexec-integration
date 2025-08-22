# 🚀 Frontend Usage Guide

Your interactive iExec TEE frontend is now running successfully!

## 🌐 Access the Interface

**Local Development:** [http://localhost:3000](http://localhost:3000)

## 🎯 How to Use

### 1. **Trigger TEE Task**

**Data Source Options:**
- ✅ **Protected Data** (Default): Uses encrypted data from iExec storage
  - Pre-configured with your deployed protected data address
  - Input data remains confidential (not exposed in results)
  
- 🧪 **Test Data**: Uses visible command line arguments for debugging
  - Enter any number between 1-1,000,000
  - Input value will be visible in results

**Click "Trigger TEE Task"** to start execution

### 2. **Monitor Progress**

**Real-time Status Updates:**
- 🟡 **Pending** → Task submitted, waiting to start
- 🔵 **Running** → TEE worker processing your task  
- 🟢 **Completed** → Results ready with scoring logic applied
- 🔴 **Failed** → Task encountered an error

**Auto-polling:** Status updates every few seconds automatically

### 3. **View Results**

**Scoring Results Display:**
- **Logic Applied**: Shows `A * 2` scoring algorithm
- **Result**: Computed score value
- **Data Source**: Indicates if from protected or test data
- **Security Info**: TEE privacy protection details

**Task Information:**
- Task ID and Deal ID with copy buttons
- Creation and completion timestamps
- Duration metrics

### 4. **Verify Proofs**

**Click "View Proof"** to see cryptographic verification:
- **Verification Status**: ✅ Valid / ❌ Invalid
- **Consensus Details**: Worker agreement metrics
- **TEE Signatures**: Cryptographic proof data
- **Explorer Links**: View on iExec blockchain explorer

## 🔒 Security Features

### **Data Privacy Protection**
- **Protected Data Mode**: Input values never exposed in UI
- **TEE Processing**: All computation in trusted execution environment  
- **Encrypted Storage**: Data encrypted client-side before upload

### **Verification & Trust**
- **Cryptographic Proofs**: Every result includes verification data
- **Consensus Mechanisms**: Multiple workers validate execution
- **Blockchain Records**: All tasks recorded on iExec network

## 🎨 UI Features

### **Modern Interface**
- **Responsive Design**: Works on desktop, tablet, mobile
- **Real-time Updates**: Live status indicators and progress
- **Copy Functions**: Easy copying of addresses and hashes
- **Loading Animations**: Smooth visual feedback

### **Task Management**
- **History Panel**: View recent task executions
- **Status Indicators**: Color-coded progress states
- **Quick Actions**: Direct links to blockchain explorer

## 🛠 Current Configuration

**Network:** iExec Bellecour Testnet  
**TEE App:** `0x5eC82059CbF38C005B73e70220a5192B19E7A12c`  
**Protected Data:** `0xedEE98aA169B6685625c7a8b5bd5C8ece41B4BB6`  

**Mock Mode:** Currently using mock service for UI demonstration
- Tasks complete after ~8 seconds for demo purposes
- All UI features functional with simulated data
- Switch to real iExec service when ready for production

## 🔄 Development vs Production

### **Current State (Development)**
- Mock service simulates TEE task execution
- No real blockchain transactions
- Perfect for UI/UX testing and demonstration

### **Production Integration**
To connect to real iExec network:
1. Replace `mockService` imports with `iexecService`
2. Configure wallet connection
3. Ensure sufficient RLC balance
4. Test with real protected data

## 📱 Browser Compatibility

**Supported Browsers:**
- Chrome/Edge 90+
- Firefox 88+  
- Safari 14+

**Features:**
- Copy-to-clipboard functionality
- Smooth animations and transitions  
- Responsive layouts for all screen sizes

## 🎯 Next Steps

1. **Test the Interface**: Try both protected and test data modes
2. **Explore Proofs**: View cryptographic verification details
3. **Check History**: Monitor multiple task executions
4. **Production Ready**: When ready, switch to real iExec integration

Your frontend is now fully functional for demonstrating secure TEE-based credit score processing! 🎉