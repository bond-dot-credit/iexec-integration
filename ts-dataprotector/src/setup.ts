import { ethers } from 'ethers';
import { getWeb3Provider } from '@iexec/dataprotector';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

/**
 * Setup script to help configure wallet for iExec DataProtector
 */
async function setup() {
  console.log('iExec DataProtector Setup');
  console.log('============================\n');

  // Check if .env file exists
  if (!fs.existsSync('.env')) {
    console.log('📝 Creating .env file from example...');
    fs.copyFileSync('.env.example', '.env');
  }

  // Check current private key
  const currentPrivateKey = process.env.PRIVATE_KEY;
  
  if (!currentPrivateKey || currentPrivateKey === 'your_private_key_here' || currentPrivateKey === '0000000000000000000000000000000000000000000000000000000000000001') {
    console.log('No valid private key found. Generating new test wallet...\n');
    
    // Generate new wallet
    const wallet = ethers.Wallet.createRandom();
    
    console.log('Generated Test Wallet:');
    console.log('========================');
    console.log('Address:', wallet.address);
    console.log('Private Key:', wallet.privateKey);
    console.log('Mnemonic:', wallet.mnemonic?.phrase);
    console.log();
    
    // Update .env file
    let envContent = fs.readFileSync('.env', 'utf8');
    envContent = envContent.replace(/PRIVATE_KEY=.*/, `PRIVATE_KEY=${wallet.privateKey}`);
    envContent = envContent.replace(/WALLET_ADDRESS=.*/, `WALLET_ADDRESS=${wallet.address}`);
    fs.writeFileSync('.env', envContent);
    
    console.log('Updated .env file with new wallet credentials');
    console.log();
    
    console.log('IMPORTANT NOTES:');
    console.log('==================');
    console.log('1. This is a TEST WALLET for development purposes');
    console.log('2. For production, use your own funded wallet');
    console.log('3. You need RLC tokens on iExec Bellecour network for transactions');
    console.log('4. Get test RLC from: https://faucet.iex.ec/');
    console.log('5. Add Bellecour network to MetaMask:');
    console.log('   - Network Name: iExec Sidechain');
    console.log('   - RPC URL: https://bellecour.iex.ec');
    console.log('   - Chain ID: 134');
    console.log('   - Currency: xRLC');
    console.log();
    
    console.log('Next Steps:');
    console.log('=============');
    console.log('1. Get test RLC tokens from the faucet');
    console.log('2. Run: npm run protect-data');
    console.log('3. Or run full test suite: npm test');
    
  } else {
    // Validate existing wallet
    try {
      const wallet = new ethers.Wallet(currentPrivateKey);
      console.log('Valid wallet found in .env:');
      console.log('Address:', wallet.address);
      
      // Test connection using iExec DataProtector
      console.log('Testing iExec DataProtector configuration...');

      try {
        const web3Provider = getWeb3Provider(currentPrivateKey);
        console.log('iExec DataProtector provider configured successfully');
        console.log('💡 Note: Balance checking requires test RLC tokens from https://faucet.iex.ec/');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log('Failed to configure DataProtector:', errorMessage);
      }
      
    } catch (error) {
      console.log('Invalid private key in .env file');
      console.log('Please check your PRIVATE_KEY value');
    }
  }

  console.log('Setup complete! Ready to use iExec DataProtector.');
}

if (require.main === module) {
  setup().catch(console.error);
}