#!/usr/bin/env node

/**
 * Test script to verify TEE execution is working properly
 * This bypasses the frontend React app and directly tests the iExec integration
 */

const { IExec } = require('iexec');
const { ethers } = require('ethers');

const DEPLOYED_ADDRESSES = {
  TEE_APP: '0x5eC82059CbF38C005B73e70220a5192B19E7A12c',
  PROTECTED_DATA: '0xedEE98aA169B6685625c7a8b5bd5C8ece41B4BB6'
};

async function testTEEExecution() {
  console.log('🚀 Testing TEE Task Execution\n');
  
  try {
    // Check if wallet private key is available from env or config
    const walletPrivateKey = process.env.WALLET_PRIVATE_KEY || '0x10093fc94da0654265595753e638e3e6e269d198a298994e344f5718ce5b7b12';
    
    // Create wallet and provider
    const provider = new ethers.JsonRpcProvider('https://bellecour.iex.ec');
    const wallet = new ethers.Wallet(walletPrivateKey, provider);
    
    // Initialize iExec
    const iexec = new IExec(
      { ethProvider: wallet.provider },
      { useGas: false }
    );
    
    console.log('✅ iExec initialized');
    console.log('📍 Network: Bellecour (Chain ID: 134)');
    console.log('👛 Wallet:', await wallet.getAddress());
    console.log('🔧 App Address:', DEPLOYED_ADDRESSES.TEE_APP);
    console.log();
    
    // Check workerpool availability
    console.log('🔍 Checking for TEE workerpools...');
    const workerpoolOrders = await iexec.orderbook.fetchWorkerpoolOrderbook();
    
    const teeOrders = workerpoolOrders.orders?.filter((orderEntry) => {
      const order = orderEntry.order;
      const category = parseInt(order.category || '0');
      const remaining = parseInt(orderEntry.remaining || '0');
      const tag = order.tag || '0x0000000000000000000000000000000000000000000000000000000000000000';
      
      // Check for TEE capability
      const tagBigInt = BigInt(tag);
      const hasTeeTag = (tagBigInt & BigInt('0x3')) !== BigInt('0');
      
      return remaining > 0 && category === 5 && hasTeeTag;
    }) || [];
    
    console.log(`📊 Total workerpools found: ${workerpoolOrders.orders?.length || 0}`);
    console.log(`🔒 TEE workerpools available: ${teeOrders.length}`);
    
    if (teeOrders.length === 0) {
      console.log('❌ No TEE workerpools currently available');
      console.log('💡 This is the main blocker preventing TEE execution');
      console.log();
      console.log('🎯 Solutions:');
      console.log('  1. Wait for TEE infrastructure to come online');
      console.log('  2. Contact iExec support about TEE workerpool availability');
      console.log('  3. Try running on iExec mainnet instead of testnet');
      console.log('  4. Use test mode (non-TEE) for development');
      return;
    }
    
    console.log('✅ TEE workerpools are available, proceeding with task execution...');
    
    // Try to create a test task
    console.log('🏗️ Creating TEE task order...');
    
    const orderParams = {
      app: DEPLOYED_ADDRESSES.TEE_APP,
      category: 5, // TEE category
      appmaxprice: 0,
      workerpoolmaxprice: 1000000000,
      requestermaxprice: 1000000000,
      volume: 1,
      tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
      params: {
        args: '42' // Test with command line args
      }
    };
    
    const requestOrder = await iexec.order.createRequestorder(orderParams);
    const signedRequestOrder = await iexec.order.signRequestorder(requestOrder);
    
    console.log('✅ Request order created and signed');
    console.log('📝 Order hash:', signedRequestOrder.order);
    
    // Get app order
    console.log('🔍 Fetching app orders...');
    const appOrders = await iexec.orderbook.fetchAppOrderbook(DEPLOYED_ADDRESSES.TEE_APP);
    
    if (!appOrders.orders || appOrders.orders.length === 0) {
      console.log('❌ No app orders found for TEE app');
      console.log('💡 The app owner needs to publish orders to the marketplace');
      return;
    }
    
    const appOrder = appOrders.orders[0].order;
    console.log('✅ App order found:', appOrder.app);
    
    // Get TEE workerpool order
    const workerpoolOrder = teeOrders[0].order;
    console.log('✅ TEE workerpool order found:', workerpoolOrder.workerpool);
    
    // Match orders to create deal
    console.log('🤝 Matching orders to create deal...');
    
    const matchResult = await iexec.order.matchOrders({
      apporder: appOrder,
      workerpoolorder: workerpoolOrder,
      requestorder: signedRequestOrder
    });
    
    const dealId = typeof matchResult === 'string' ? matchResult : matchResult.dealid;
    const taskId = await iexec.deal.computeTaskId(dealId, 0);
    
    console.log('✅ Deal created successfully!');
    console.log('📄 Deal ID:', dealId);
    console.log('📋 Task ID:', taskId);
    console.log('🌐 Explorer:', `https://explorer.iex.ec/bellecour/task/${taskId}`);
    
    // Monitor task execution
    console.log('⏳ Monitoring task execution...');
    
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes
    
    while (attempts < maxAttempts) {
      try {
        const task = await iexec.task.show(taskId);
        console.log(`📊 Status: ${task.statusName} (attempt ${attempts + 1}/${maxAttempts})`);
        
        if (task.statusName === 'COMPLETED') {
          console.log('🎉 Task completed successfully!');
          
          if (task.results && typeof task.results === 'object' && task.results.location) {
            console.log('📥 Fetching results...');
            try {
              const response = await fetch(task.results.location);
              const resultContent = await response.text();
              console.log('📊 Result:', resultContent);
              
              try {
                const parsedResult = JSON.parse(resultContent);
                console.log('✅ Parsed scoring result:', parsedResult);
              } catch (e) {
                console.log('ℹ️ Result is not JSON format');
              }
            } catch (e) {
              console.log('❌ Could not fetch result content:', e.message);
            }
          }
          
          return;
        }
        
        if (task.statusName === 'FAILED' || task.statusName === 'TIMEOUT') {
          console.log('❌ Task failed with status:', task.statusName);
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } catch (error) {
        console.log('⚠️ Error checking task status:', error.message);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    console.log('⏰ Task monitoring timeout - task may still be running');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🔧 Stack trace:', error.stack);
  }
}

if (require.main === module) {
  testTEEExecution().catch(console.error);
}