import { IExecDataProtector, getWeb3Provider } from '@iexec/dataprotector';
import dotenv from 'dotenv';
import {
  CreditScoreData,
  ProtectedDataResponse,
  DataProtectorConfig,
  createDataProtectorError
} from './types';

dotenv.config();

export class ScoreDataProtector {
  private dataProtector: IExecDataProtector;

  constructor(config?: DataProtectorConfig) {
    // Create provider with signer if not provided
    let web3Provider = config?.web3Provider;
    
    if (!web3Provider && process.env.PRIVATE_KEY) {
      // Use iExec's getWeb3Provider helper function
      web3Provider = getWeb3Provider(process.env.PRIVATE_KEY);
      console.log('Using iExec DataProtector with configured wallet');
    }
    
    this.dataProtector = new IExecDataProtector(web3Provider);
  }

  /**
   * Encrypts and uploads credit score data to iExec's protected data storage
   * @param scoreData The credit score data to protect
   * @param name Optional name for the protected data
   * @returns Promise containing the protected data information
   */
  async protectCreditScore(
    scoreData: CreditScoreData,
    name?: string
  ): Promise<ProtectedDataResponse> {
    try {
      console.log('Protecting credit score data for agent:', scoreData.agentId);
      
      const protectedData = await this.dataProtector.core.protectData({
        data: scoreData,
        name: name || `CreditScore_${scoreData.agentId}_${Date.now()}`,
      });

      console.log('Credit score data protected successfully!');
      console.log('Protected Data Address:', protectedData.address);
      console.log('Data Owner:', protectedData.owner);
      console.log('Creation Time:', new Date(protectedData.creationTimestamp));

      return protectedData;
    } catch (error) {
      console.error('Error protecting credit score data:', error);
      throw createDataProtectorError('Failed to protect credit score data', error, 'PROTECT_DATA_ERROR');
    }
  }

  /**
   * Grants access to specific wallet address and app
   * @param protectedDataAddress The address of the protected data
   * @param authorizedUser Wallet address to grant access to (use '0x0000000000000000000000000000000000000000' for all users)
   * @param authorizedApp App address to grant access to
   * @param pricePerAccess Price in nRLC (nano RLC) per access
   * @param numberOfAccess Number of times the data can be accessed
   * @returns Promise containing the dataset order information
   */
  async grantAccessToScore(
    protectedDataAddress: string,
    authorizedUser: string,
    authorizedApp: string,
    pricePerAccess: number = 0,
    numberOfAccess: number = 1
  ): Promise<any> {
    try {
      console.log('Granting access to protected credit score data...');
      console.log('Protected Data:', protectedDataAddress);
      console.log('Authorized User:', authorizedUser);
      console.log('Authorized App:', authorizedApp);
      console.log('Price per Access:', pricePerAccess, 'nRLC');
      console.log('Number of Accesses:', numberOfAccess);

      const grantAccessResult = await this.dataProtector.core.grantAccess({
        protectedData: protectedDataAddress,
        authorizedUser: authorizedUser,
        authorizedApp: authorizedApp,
        pricePerAccess: pricePerAccess,
        numberOfAccess: numberOfAccess,
      });

      console.log('Access granted successfully!');
      console.log('Grant Result:', grantAccessResult);
      
      return grantAccessResult;
    } catch (error) {
      console.error('Error granting access to credit score data:', error);
      throw createDataProtectorError('Failed to grant access to credit score data', error, 'GRANT_ACCESS_ERROR');
    }
  }

  /**
   * Revokes access to protected data
   * Note: This is a placeholder implementation. In practice, you would need the 
   * specific grant order hash obtained from the grantAccess result.
   */
  async revokeAccess(grantedAccess: any): Promise<any> {
    try {
      console.log('Revoking access to protected credit score data...');

      const revokeResult = await this.dataProtector.core.revokeOneAccess(grantedAccess);

      console.log('Access revoked successfully!');
      return revokeResult;
    } catch (error) {
      console.error('Error revoking access:', error);
      throw createDataProtectorError('Failed to revoke access', error, 'REVOKE_ACCESS_ERROR');
    }
  }

  /**
   * Fetches information about protected data
   * @param protectedDataAddress The address of the protected data
   */
  async getProtectedDataInfo(protectedDataAddress: string): Promise<any> {
    try {
      const info = await this.dataProtector.core.getProtectedData({
        protectedDataAddress: protectedDataAddress,
      });

      console.log('Protected Data Information:');
      console.log('Protected Data:', info);

      return info;
    } catch (error) {
      console.error('Error fetching protected data info:', error);
      throw createDataProtectorError('Failed to fetch protected data info', error, 'FETCH_INFO_ERROR');
    }
  }
}

// CLI usage with environment variables
export async function uploadFromEnv() {
  try {
    // Validate required environment variables
    const requiredEnvVars = ['AGENT_ID', 'CREDIT_SCORE'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    // Initialize the data protector
    const scoreProtector = new ScoreDataProtector();

    // Validate and parse risk category
    const riskCategoryInput = process.env.RISK_CATEGORY || 'medium';
    const validRiskCategories = ['low', 'medium', 'high'] as const;
    const riskCategory = validRiskCategories.includes(riskCategoryInput as any) 
      ? riskCategoryInput as 'low' | 'medium' | 'high'
      : 'medium';

    // Read credit score data from environment variables
    // Note: TEE app expects the key "A" for the integer value
    const scoreData: CreditScoreData = {
      agentId: process.env.AGENT_ID!,
      creditScore: parseInt(process.env.CREDIT_SCORE!),
      A: parseInt(process.env.CREDIT_SCORE!), // TEE app looks for this key
      timestamp: Date.now(),
      scoreVersion: process.env.SCORE_VERSION || '2.1.0',
      metadata: {
        model: process.env.MODEL_NAME || 'bond_credit_v2',
        confidence: parseFloat(process.env.CONFIDENCE || '0.92'),
        riskCategory: riskCategory
      }
    };

    console.log('📊 Credit Score Data from Environment:');
    console.log('- Agent ID:', scoreData.agentId);
    console.log('- Credit Score:', scoreData.creditScore);
    console.log('- Score Version:', scoreData.scoreVersion);
    console.log('- Model:', scoreData.metadata?.model);
    console.log('- Confidence:', scoreData.metadata?.confidence);
    console.log('- Risk Category:', scoreData.metadata?.riskCategory);

    // Use custom name from env or generate one
    const dataName = process.env.DATA_NAME || `CreditScore_${scoreData.agentId}_${Date.now()}`;
    
    // Protect the credit score data
    const protectedData = await scoreProtector.protectCreditScore(scoreData, dataName);

    console.log('✅ Protected data uploaded successfully!');
    console.log('🔑 Use this address for granting access:', protectedData.address);

    return protectedData;
  } catch (error) {
    console.error('❌ Upload failed:', error);
    throw error;
  }
}

if (require.main === module) {
  uploadFromEnv().catch(console.error);
}