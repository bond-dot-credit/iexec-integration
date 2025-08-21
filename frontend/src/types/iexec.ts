/**
 * Frontend type definitions for iExec integration
 */

// TEE Task Types
export interface TriggerTEETaskParams {
  inputValue: number;
  useProtectedData?: boolean;
  protectedDataAddress?: string;
}

export interface TEETaskResult {
  taskId: string;
  dealId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  createdAt: number;
  completedAt?: number;
}

// Scoring Logic Results
export interface ScoringResult {
  scoring_logic: string;
  result: number;
  status: 'success' | 'error';
  data_source: 'protected_data' | 'command_line_args';
  input_A?: number; // Only visible for non-protected data
  error_message?: string;
}

// UI States
export interface TaskState {
  isLoading: boolean;
  error: string | null;
  currentTask: TEETaskResult | null;
  taskHistory: TEETaskResult[];
}

// iExec Network Configuration
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
}

// Deployed Contract Addresses (from CLAUDE.md)
export const DEPLOYED_ADDRESSES = {
  TEE_APP: '0x5eC82059CbF38C005B73e70220a5192B19E7A12c',
  PROTECTED_DATA: '0xedEE98aA169B6685625c7a8b5bd5C8ece41B4BB6',
  NETWORK: 'bellecour'
} as const;

// Network configurations
export const NETWORKS: Record<string, NetworkConfig> = {
  bellecour: {
    chainId: 134,
    name: 'iExec Bellecour',
    rpcUrl: 'https://bellecour.iex.ec',
    explorerUrl: 'https://explorer.iex.ec/bellecour'
  }
} as const;

// Proof/Verification Types
export interface TaskProof {
  taskId: string;
  dealId: string;
  workerAddress: string;
  consensusValue: string;
  resultHash: string;
  resultLink: string;
  teeSignature?: string;
}

export interface VerificationResult {
  isValid: boolean;
  proofData: TaskProof;
  verificationTimestamp: number;
  details: {
    consensusReached: boolean;
    resultAvailable: boolean;
    signatureValid: boolean;
  };
}

// Form validation types
export interface FormErrors {
  inputValue?: string;
  protectedDataAddress?: string;
  general?: string;
}

// Component Props
export interface TriggerTaskProps {
  onTaskTriggered: (task: TEETaskResult) => void;
  disabled?: boolean;
}

export interface ScoreDisplayProps {
  task: TEETaskResult | null;
  onViewProof: (taskId: string) => void;
}

export interface ProofDisplayProps {
  proof: VerificationResult | null;
  isLoading: boolean;
}