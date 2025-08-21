# iExec TEE Scoring Logic Frontend

Interactive web interface for triggering TEE tasks and viewing scoring results using iExec's decentralized confidential computing platform.

## Features

### 🔒 TEE Task Execution
- **Trigger TEE Tasks**: Execute scoring logic (`A * 2`) in trusted execution environment
- **Protected Data Support**: Use encrypted data from iExec's DataProtector
- **Test Mode**: Debug with visible command line arguments

### 📊 Results Display
- **Real-time Status**: Live task status updates with auto-polling
- **Score Results**: View scoring logic results with data source tracking
- **Task History**: Browse recent TEE executions

### 🔍 Cryptographic Proofs
- **Verification Display**: View TEE execution proofs and consensus data
- **Worker Information**: See TEE worker addresses and signatures
- **Explorer Integration**: Direct links to iExec blockchain explorer

### 🎨 Modern UI/UX
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Auto-refreshing status indicators
- **Copy-to-clipboard**: Easy copying of addresses and hashes
- **Loading States**: Smooth animations and progress indicators

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend│───▶│   iExec SDK      │───▶│  TEE Workers    │
│   (This App)    │    │   Integration    │    │  (Bellecour)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         ▼                        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   UI Components │    │  Protected Data  │    │  Scoring Logic  │
│   - TriggerTask │    │  (Encrypted)     │    │  (result=A*2)   │
│   - ScoreDisplay│    │                  │    │                 │
│   - ProofViewer │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 16+ and npm/yarn
- Modern web browser with Web3 support (optional)
- Access to iExec Bellecour testnet

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm start
```

Opens [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
```

Creates optimized build in `build/` directory.

## Configuration

### Network Settings

The app is pre-configured for iExec Bellecour testnet:

- **Chain ID**: 134
- **RPC URL**: https://bellecour.iex.ec
- **Explorer**: https://explorer.iex.ec/bellecour

### Deployed Contracts

- **TEE App**: `0x5eC82059CbF38C005B73e70220a5192B19E7A12c`
- **Protected Data**: `0xedEE98aA169B6685625c7a8b5bd5C8ece41B4BB6`

## Usage Guide

### 1. Trigger TEE Task

1. **Choose Data Source**:
   - **Protected Data**: Use encrypted data from iExec storage (production)
   - **Test Data**: Use command line arguments (debugging)

2. **Configure Parameters**:
   - **Protected Data Address**: Default production address pre-filled
   - **Test Input Value**: Integer between 1-1,000,000 for testing

3. **Execute**: Click "Trigger TEE Task" to start execution

### 2. View Results

- **Status Tracking**: Real-time updates as task progresses
- **Scoring Results**: See computed results with data source info
- **Security Info**: Understand TEE privacy features

### 3. Verify Proofs

- **Cryptographic Verification**: View TEE execution proofs
- **Consensus Data**: Check worker consensus and signatures
- **Explorer Links**: Verify on iExec blockchain explorer

## Components

### TriggerTEETask
Interactive form for configuring and launching TEE tasks:
- Data source selection (protected vs test data)
- Input validation and error handling
- Real-time form feedback

### ScoreDisplay
Results viewer with auto-updating status:
- Task progress tracking
- Scoring logic results display
- Action buttons for proof viewing

### ProofDisplay
Modal for viewing cryptographic proofs:
- Verification status indicators
- Worker and consensus information
- Copy-to-clipboard functionality

## API Integration

### iExec SDK Integration

```typescript
// Initialize iExec service
await iexecService.initialize();

// Trigger TEE task
const task = await iexecService.triggerTEETask({
  inputValue: 42,
  useProtectedData: true,
  protectedDataAddress: '0x...'
});

// Poll for results
const result = await iexecService.pollTaskUntilComplete(task.taskId);

// Get verification proof
const proof = await iexecService.getTaskProof(task.taskId);
```

### Task Flow

1. **Create Orders**: App, workerpool, and request orders
2. **Match Orders**: Execute order matching on iExec
3. **Monitor Task**: Poll task status until completion
4. **Fetch Results**: Download results from IPFS
5. **Verify Proof**: Get cryptographic verification data

## Security Features

### Data Protection
- **Client-side Encryption**: Protected data encrypted before upload
- **TEE Processing**: Computation in Intel SGX trusted environment
- **Input Privacy**: Protected data inputs never exposed in results

### Verification
- **Consensus Mechanisms**: Multiple workers validate results
- **Cryptographic Proofs**: TEE-signed execution evidence
- **Blockchain Transparency**: All transactions recorded on-chain

## Styling

Built with **Tailwind CSS** for modern, responsive design:

- **Color Scheme**: Blue/indigo primary with semantic colors
- **Typography**: Clear hierarchy with monospace for addresses
- **Animations**: Smooth transitions and loading states
- **Mobile-First**: Responsive grid layouts

### Custom Animations
- Pulse effects for loading states
- Fade/slide transitions for modals
- Success/error state animations

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Troubleshooting

### Connection Issues
- Ensure iExec Bellecour network is accessible
- Check browser console for network errors
- Verify TEE app and protected data addresses

### Task Failures
- Check input validation errors
- Verify sufficient balance for task execution
- Monitor task status in iExec explorer

### Performance
- Large result sets may take time to load
- Task polling uses 5-second intervals
- UI optimized for concurrent operations

## Development

### Project Structure
```
src/
├── components/          # React components
│   ├── TriggerTEETask.tsx
│   ├── ScoreDisplay.tsx
│   └── ProofDisplay.tsx
├── services/           # API services
│   └── iexecService.ts
├── types/              # TypeScript definitions
│   └── iexec.ts
└── styles/             # CSS and styling
    ├── index.css
    └── App.css
```

### Adding Features

1. **New Components**: Add to `components/` directory
2. **API Methods**: Extend `iexecService.ts`
3. **Type Definitions**: Update `types/iexec.ts`
4. **Styling**: Use Tailwind classes or extend `App.css`

## License

MIT - See parent project license