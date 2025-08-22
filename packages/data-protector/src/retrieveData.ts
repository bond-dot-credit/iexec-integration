import { ScoreDataProtector } from './protectScoreData';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Simple utility to retrieve and display protected data information
 */
export class DataRetriever {
  private scoreProtector: ScoreDataProtector;

  constructor() {
    this.scoreProtector = new ScoreDataProtector();
  }

  /**
   * Retrieves protected data information
   * @param protectedDataAddress The address of the protected data
   */
  async retrieveProtectedData(protectedDataAddress: string): Promise<any> {
    try {
      console.log('🔍 Retrieving protected data information...');
      console.log('Protected Data Address:', protectedDataAddress);
      
      const dataInfo = await this.scoreProtector.getProtectedDataInfo(protectedDataAddress);
      
      console.log('✅ Successfully retrieved protected data!');
      console.log('📊 Data Information:');
      console.log('- Owner:', dataInfo.owner);
      console.log('- Name:', dataInfo.name);
      console.log('- Creation Time:', new Date(dataInfo.creationTimestamp * 1000));
      console.log('- Schema:', dataInfo.schema);
      
      return dataInfo;
    } catch (error) {
      console.error('❌ Failed to retrieve protected data:', error);
      throw error;
    }
  }
}

// CLI interface for retrieving data
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: npm run retrieve-data <protected-data-address>');
    process.exit(1);
  }

  const [protectedDataAddress] = args;
  
  try {
    const retriever = new DataRetriever();
    await retriever.retrieveProtectedData(protectedDataAddress);
    
    console.log('✅ Data retrieval completed!');
  } catch (error) {
    console.error('❌ Data retrieval failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}