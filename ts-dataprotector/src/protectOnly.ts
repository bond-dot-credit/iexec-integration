import { ScoreDataProtector, CreditScoreData } from './index';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Test script that only protects data without granting access
 * This demonstrates the core data protection functionality
 */
async function protectDataOnly() {
  console.log('iExec DataProtector - Credit Score Protection Test');
  console.log('==================================================\n');

  try {
    // Initialize the data protector
    const scoreProtector = new ScoreDataProtector();

    // Sample credit score data
    const sampleScoreData: CreditScoreData = {
      agentId: process.env.EXAMPLE_AGENT_ID || 'agent_12345',
      creditScore: parseInt(process.env.EXAMPLE_CREDIT_SCORE || '750'),
      timestamp: Date.now(),
      scoreVersion: process.env.EXAMPLE_MODEL_VERSION || '2.1.0',
      metadata: {
        model: 'bond_credit_v2',
        confidence: 0.92,
        riskCategory: 'low'
      }
    };

    console.log('Credit Score Data to Protect:');
    console.log('================================');
    console.log('Agent ID:', sampleScoreData.agentId);
    console.log('Credit Score:', sampleScoreData.creditScore);
    console.log('Score Version:', sampleScoreData.scoreVersion);
    console.log('Risk Category:', sampleScoreData.metadata?.riskCategory);
    console.log('Model Confidence:', sampleScoreData.metadata?.confidence);
    console.log();

    // Protect the credit score data
    console.log('Encrypting and uploading to iExec decentralized storage...');
    const protectedData = await scoreProtector.protectCreditScore(
      sampleScoreData,
      `CreditScore_${sampleScoreData.agentId}_${Date.now()}`
    );

    console.log('\n🎉 SUCCESS! Credit Score Data Protected');
    console.log('=====================================');
    console.log('Protected Data Address:', protectedData.address);
    console.log('Data Owner:', protectedData.owner);
    console.log('Data Name:', protectedData.name);
    console.log('Creation Time:', new Date(protectedData.creationTimestamp));
    console.log();
    
    console.log('Key Achievements:');
    console.log('===================');
    console.log('• Credit score data encrypted client-side before upload');
    console.log('• Data stored on iExec\'s decentralized infrastructure');
    console.log('• Immutable protected data address generated');
    console.log('• Data ownership verified on blockchain');
    console.log('• Ready for secure access management');
    console.log();
    
    console.log('Protected Data Details:');
    console.log('=========================');
    console.log('• This data is now encrypted and secure');
    console.log('• Only authorized users/apps can access it');
    console.log('• Access permissions are managed via blockchain');
    console.log('• Original sensitive data is never exposed');
    console.log();
    
    console.log('Next Steps:');
    console.log('=============');
    console.log('1. Deploy a TEE app on iExec to process this data');
    console.log('2. Use grantAccess to authorize specific users/apps');
    console.log('3. Process the data securely in TEE environment');
    console.log('4. Get unencrypted results while protecting input data');
    
    return protectedData;
    
  } catch (error) {
    console.error('\n Data Protection Failed:', error);
    console.log('\ Troubleshooting:');
    console.log('==================');
    console.log('• Check your PRIVATE_KEY in .env file');
    console.log('• Ensure wallet has some xRLC tokens (get from https://faucet.iex.ec/)');
    console.log('• Verify network connectivity to iExec Bellecour');
    console.log('• Run: npm run setup (to reconfigure wallet)');
    throw error;
  }
}

if (require.main === module) {
  protectDataOnly().catch(console.error);
}