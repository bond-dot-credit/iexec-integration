/**
 * Type definitions for iExec DataProtector integration
 */

// Credit Score Data Structure (compatible with iExec DataObject)
export interface CreditScoreData {
  [key: string]: any; // Index signature for iExec compatibility
  agentId: string;
  creditScore: number;
  timestamp: number;
  scoreVersion: string;
  metadata?: CreditScoreMetadata;
}

export interface CreditScoreMetadata {
  model: string;
  confidence: number;
  riskCategory: RiskCategory;
  [key: string]: any; // Allow additional metadata fields
}

export type RiskCategory = 'low' | 'medium' | 'high';

// Protected Data Response Types
export interface ProtectedDataResponse {
  address: string;
  owner: string;
  name: string;
  schema: any;
  creationTimestamp: number;
}

export interface ProtectedDataInfo {
  name: string;
  owner: string;
  schema: any;
  creationTimestamp: number;
  multiaddr: string;
  checksum: string;
}

// Access Grant Types
export interface GrantAccessParams {
  protectedData: string;
  authorizedUser: string;
  authorizedApp: string;
  pricePerAccess?: number;
  numberOfAccess?: number;
}

// Updated to match actual iExec API response
export interface GrantAccessResult {
  orderHash?: string;
  [key: string]: any; // Flexible to accommodate actual API response
}

export interface DatasetOrder {
  dataset: string;
  datasetprice: number;
  volume: number;
  tag: string;
  apprestrict: string;
  workerpoolrestrict: string;
  requesterrestrict: string;
  salt: string;
  sign: string;
}

// Revoke Access Types
export interface RevokeAccessParams {
  protectedData: string;
  authorizedUser: string;
  authorizedApp: string;
}

export interface RevokeAccessResult {
  txHash: string;
  chainId: number;
}

// Batch Operation Result Types
export interface BatchGrantResult {
  user?: string;
  app?: string;
  success: boolean;
  result?: GrantAccessResult;
  error?: string;
}

export interface BatchRevokeResult {
  user: string;
  success: boolean;
  result?: RevokeAccessResult;
  error?: string;
}

// Error Types
export interface DataProtectorError extends Error {
  code?: string;
  details?: any;
}

export class DataProtectorOperationError extends Error implements DataProtectorError {
  public code?: string;
  public details?: any;

  constructor(message: string, code?: string, details?: any) {
    super(message);
    this.name = 'DataProtectorOperationError';
    this.code = code;
    this.details = details;
  }
}

// Configuration Types
export interface DataProtectorConfig {
  chainId?: number;
  web3Provider?: any;
  privateKey?: string;
}

export interface AccessControlConfig {
  defaultPricePerAccess: number;
  defaultNumberOfAccess: number;
  publicAddress: string;
}

// Test Types
export interface TestCase {
  name: string;
  agentId: string;
  creditScore: number;
  authorizedUsers: string[];
  authorizedApps: string[];
  expectedUnauthorizedUser: string;
}

export interface TestResult {
  testName: string;
  success: boolean;
  error?: string;
  data?: any;
}

// Utility Types
export type WalletAddress = string;
export type AppAddress = string;
export type ProtectedDataAddress = string;
export type TransactionHash = string;

// Constants
export const CONSTANTS = {
  PUBLIC_ADDRESS: '0x0000000000000000000000000000000000000000',
  DEFAULT_PRICE: 0,
  DEFAULT_ACCESSES: 1,
  RISK_CATEGORIES: {
    LOW: 'low',
    MEDIUM: 'medium', 
    HIGH: 'high'
  } as const,
  MAX_BATCH_SIZE: 50,
  MIN_PRICE_PER_ACCESS: 0,
  MAX_PRICE_PER_ACCESS: 1000000000, // 1 RLC in nRLC
} as const;

// Type Guards
export function isCreditScoreData(data: any): data is CreditScoreData {
  return (
    typeof data === 'object' &&
    typeof data.agentId === 'string' &&
    typeof data.creditScore === 'number' &&
    typeof data.timestamp === 'number' &&
    typeof data.scoreVersion === 'string'
  );
}

export function isValidWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidRiskCategory(category: string): category is RiskCategory {
  return Object.values(CONSTANTS.RISK_CATEGORIES).includes(category as RiskCategory);
}

// Helper function to create typed error
export function createDataProtectorError(
  message: string,
  originalError: unknown,
  code?: string
): DataProtectorOperationError {
  const errorMessage = originalError instanceof Error 
    ? `${message}: ${originalError.message}`
    : `${message}: ${String(originalError)}`;
    
  return new DataProtectorOperationError(
    errorMessage,
    code,
    originalError instanceof Error ? originalError.stack : originalError
  );
}