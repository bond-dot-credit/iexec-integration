import { ScoreDataProtector } from './protectScoreData';
import dotenv from 'dotenv';
import { 
  BatchGrantResult, 
  BatchRevokeResult, 
  DataProtectorConfig,
  createDataProtectorError
} from './types';

// loading env variables
dotenv.config();

/**
 * Utility functions for managing access to protected credit score data
 */
export class AccessManager {
  public scoreProtector: ScoreDataProtector;

  constructor(config?: DataProtectorConfig) {
    this.scoreProtector = new ScoreDataProtector(config);
  }

  /**
   * Grants access to multiple users for the same protected data
   * @param protectedDataAddress The address of the protected data
   * @param users Array of user wallet addresses
   * @param authorizedApp App address to grant access to
   * @param pricePerAccess Price in nRLC per access
   * @param numberOfAccess Number of accesses per user
   */
  async grantAccessToMultipleUsers(
    protectedDataAddress: string,
    users: string[],
    authorizedApp: string,
    pricePerAccess: number = 0,
    numberOfAccess: number = 1
  ): Promise<BatchGrantResult[]> {
    const results = [];
    
    for (const user of users) {
      try {
        console.log(`Granting access to user: ${user}`);
        const result = await this.scoreProtector.grantAccessToScore(
          protectedDataAddress,
          user,
          authorizedApp,
          pricePerAccess,
          numberOfAccess
        );
        results.push({ user, success: true, result });
      } catch (error) {
        console.error(`Failed to grant access to user ${user}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ user, success: false, error: errorMessage });
      }
    }

    return results;
  }

  /**
   * Grants access to multiple apps for the same user
   * @param protectedDataAddress The address of the protected data
   * @param authorizedUser User wallet address
   * @param apps Array of app addresses
   * @param pricePerAccess Price in nRLC per access
   * @param numberOfAccess Number of accesses per app
   */
  async grantAccessToMultipleApps(
    protectedDataAddress: string,
    authorizedUser: string,
    apps: string[],
    pricePerAccess: number = 0,
    numberOfAccess: number = 1
  ): Promise<BatchGrantResult[]> {
    const results = [];
    
    for (const app of apps) {
      try {
        console.log(`Granting access to app: ${app}`);
        const result = await this.scoreProtector.grantAccessToScore(
          protectedDataAddress,
          authorizedUser,
          app,
          pricePerAccess,
          numberOfAccess
        );
        results.push({ app, success: true, result });
      } catch (error) {
        console.error(`Failed to grant access to app ${app}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ app, success: false, error: errorMessage });
      }
    }

    return results;
  }

  /**
   * Grants public access to protected data (any user can access)
   * @param protectedDataAddress The address of the protected data
   * @param authorizedApp App address to grant access to
   * @param pricePerAccess Price in nRLC per access
   * @param numberOfAccess Number of total accesses allowed
   */
  async grantPublicAccess(
    protectedDataAddress: string,
    authorizedApp: string,
    pricePerAccess: number = 0,
    numberOfAccess: number = 100
  ): Promise<BatchGrantResult> {
    console.log('🌐 Granting public access to protected data...');
    
    // Use zero address for public access as per the iexec docs
    // https://tools.docs.iex.ec/tools/dataProtector/dataProtectorCore/transferOwnership
    const publicAddress = '0x0000000000000000000000000000000000000000';
    
    try {
      const result = await this.scoreProtector.grantAccessToScore(
        protectedDataAddress,
        publicAddress,
        authorizedApp,
        pricePerAccess,
        numberOfAccess
      );
      return { success: true, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }
/**
   * List of  granted access objects
   * @param grantedAccessList Array of granted access objects to revoke
   */

 /*  const listGrantedAccess = await dataProtectorCore.getGrantedAccess({
  protectedData: '0x123abc...',
  authorizedApp: '0x456def...',
  authorizedUser: '0x789cba...',
  page: 1,
  pageSize: 100,
}); */

  /**
   * Revokes access using granted access objects
   * @param grantedAccessList Array of granted access objects to revoke
   */
  async revokeMultipleAccess(
    grantedAccessList: any[]
  ): Promise<BatchRevokeResult[]> {
    const results = [];
    
    for (let i = 0; i < grantedAccessList.length; i++) {
      const grantedAccess = grantedAccessList[i];
      try {
        console.log(`Revoking access #${i + 1}`);
        const result = await this.scoreProtector.revokeAccess(grantedAccess);
        results.push({ user: `grant_${i + 1}`, success: true, result });
      } catch (error) {
        console.error(`Failed to revoke access #${i + 1}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ user: `grant_${i + 1}`, success: false, error: errorMessage });
      }
    }

    return results;
  }
}

// CLI interface for grant access operations
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage: npm run grant-access <protected-data-address> <user-address> <app-address> [price] [accesses]');
    console.log('       npm run grant-access <protected-data-address> public <app-address> [price] [accesses]');
    process.exit(1);
  }

  const [protectedDataAddress, userAddress, appAddress, price = '0', accesses = '1'] = args;
  
  try {
    const accessManager = new AccessManager();
    
    if (userAddress.toLowerCase() === 'public') {
      console.log('Granting public access...');
      await accessManager.grantPublicAccess(
        protectedDataAddress,
        appAddress,
        parseInt(price),
        parseInt(accesses)
      );
    } else {
      console.log('Granting access to specific user...');
      await accessManager.scoreProtector.grantAccessToScore(
        protectedDataAddress,
        userAddress,
        appAddress,
        parseInt(price),
        parseInt(accesses)
      );
    }
    
    console.log('✅ Access granted successfully!');
  } catch (error) {
    console.error('❌ Failed to grant access:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}