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

// Example usage
export async function exampleUsage() {
  try {
    // Initialize the data protector
    const scoreProtector = new ScoreDataProtector();

    // Sample credit score data
    const sampleScoreData: CreditScoreData = {
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

    // Protect the credit score data
    const protectedData = await scoreProtector.protectCreditScore(
      sampleScoreData,
      'Agent_12345_CreditScore'
    );

    // Grant access to a specific user and app
    const authorizedUser = '0x1234567890123456789012345678901234567890'; // Replace with actual wallet
    const authorizedApp = '0x0987654321098765432109876543210987654321';   // Replace with actual app address
    
    await scoreProtector.grantAccessToScore(
      protectedData.address,
      authorizedUser,
      authorizedApp,
      0, // Free access
      5  // Allow 5 accesses
    );

    return protectedData;
  } catch (error) {
    console.error('Example usage failed:', error);
    throw error;
  }
}

if (require.main === module) {
  exampleUsage().catch(console.error);
}