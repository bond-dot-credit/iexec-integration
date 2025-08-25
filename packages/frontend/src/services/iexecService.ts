/**
 * Real iExec Service for production TEE task execution
 * Integrates with iExec SDK and wallet for actual blockchain interactions
 */

import { IExec } from 'iexec';
import { ethers } from 'ethers';
import { TriggerTEETaskParams, TEETaskResult, ScoringResult, TaskProof, VerificationResult, DEPLOYED_ADDRESSES } from '../types/iexec';

class IExecService {
  private iexec: IExec | null = null;
  private wallet: ethers.Wallet | null = null;
  private provider: ethers.BrowserProvider | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    console.log('Initializing iExec service...');
    
    try {
      // Check if MetaMask is available
      if (typeof (window as any).ethereum === 'undefined') {
        throw new Error('MetaMask is required to use this application. Please install MetaMask and refresh the page.');
      }

      // Request account access
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create provider and get signer
      this.provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await this.provider.getSigner();
      
      // Initialize iExec with the signer
      this.iexec = new IExec(
        { ethProvider: signer.provider as any },
        { useGas: false }
      );

      // Verify network (should be Bellecour testnet)
      const network = await this.provider.getNetwork();
      console.log('Current network:', {
        name: network.name,
        chainId: Number(network.chainId),
        expected: 134
      });
      
      if (Number(network.chainId) !== 134) { // Bellecour chain ID
        console.log('Wrong network detected, attempting to switch...');
        await this.switchToBellecour();
        
        // Re-check network after switch attempt
        const newNetwork = await this.provider.getNetwork();
        if (Number(newNetwork.chainId) !== 134) {
          throw new Error(`Please manually switch to iExec Bellecour network (Chain ID: 134). Currently connected to: ${newNetwork.name} (Chain ID: ${Number(newNetwork.chainId)})`);
        }
      }

      this.isInitialized = true;
      console.log('iExec service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize iExec service:', error);
      throw error;
    }
  }

  async triggerTEETask(params: TriggerTEETaskParams): Promise<TEETaskResult> {
    if (!this.iexec || !this.isInitialized) {
      throw new Error('iExec service not initialized');
    }

    console.log('Triggering TEE task with params:', params);

    try {
      const appAddress = DEPLOYED_ADDRESSES.TEE_APP;
      
      // Build order parameters for TEE execution
      const orderParams: any = {
        app: appAddress,
        category: 0, // Use category 0 to match successful workerpools
        appmaxprice: 0, // Free app
        workerpoolmaxprice: 1000000000, // 1 RLC
        requestermaxprice: 1000000000,
        volume: 1,
        tag: '0x0000000000000000000000000000000000000000000000000000000000000003', // TEE (0x1) + SCONE (0x2) bits
      };

      // Check data source and set parameters accordingly
      if (params.useProtectedData && params.protectedDataAddress) {
        console.log('Attempting to use protected data:', params.protectedDataAddress);
        try {
          // Try to get dataset order for protected data
          const datasetOrder = await this.getDatasetOrder(params.protectedDataAddress);
          orderParams.dataset = params.protectedDataAddress;
          orderParams.datasetmaxprice = parseInt(datasetOrder.datasetprice || '0');
          console.log('Using protected data mode with dataset order');
        } catch (error) {
          console.warn('Could not access protected data, falling back to test mode:', error);
          orderParams.params = {
            args: params.inputValue?.toString() || '42'
          };
          console.log('Using test mode fallback with input:', params.inputValue);
        }
      } else {
        // Use command line args for test mode
        orderParams.params = {
          args: params.inputValue?.toString() || '42'
        };
        console.log('Using test mode with input:', params.inputValue);
      }

      // Create and sign the request order
      const requestOrder = await this.iexec.order.createRequestorder(orderParams);
      const signedRequestOrder = await this.iexec.order.signRequestorder(requestOrder);

      // Build match orders request
      const matchOrdersRequest: any = {
        apporder: await this.getAppOrder(appAddress),
        workerpoolorder: await this.getWorkerpoolOrder(),
        requestorder: signedRequestOrder
      };
      
      // Add dataset order if using protected data
      if (orderParams.dataset) {
        try {
          matchOrdersRequest.datasetorder = await this.getDatasetOrder(orderParams.dataset);
          console.log('Including dataset order in match request');
        } catch (error) {
          console.warn('Could not get dataset order, continuing without:', error);
        }
      }
      
      const matchOrdersResult = await this.iexec.order.matchOrders(matchOrdersRequest);

      const dealId = typeof matchOrdersResult === 'string' ? matchOrdersResult : matchOrdersResult.dealid;
      
      console.log('Deal created:', dealId);
      console.log('Deal type:', typeof dealId);
      
      let taskId: string;
      try {
        taskId = await this.iexec.deal.computeTaskId(dealId, 0);
        console.log('Computed task ID:', taskId);
      } catch (error) {
        console.error('Error computing task ID:', error);
        // Fallback: use deal ID to find task
        try {
          const deal = await this.iexec.deal.show(dealId);
          if (deal.tasks && typeof deal.tasks === 'object') {
            const taskIds = Object.values(deal.tasks);
            if (taskIds.length > 0) {
              taskId = taskIds[0];
              console.log('Found task ID from deal:', taskId);
            } else {
              throw new Error('No tasks found in deal');
            }
          } else {
            throw new Error('No tasks found in deal');
          }
        } catch (dealError) {
          console.error('Error getting deal details:', dealError);
          throw new Error(`Failed to get task ID for deal ${dealId}`);
        }
      }

      return {
        taskId,
        dealId: String(dealId),
        status: 'pending',
        createdAt: Date.now(),
      };
    } catch (error) {
      console.error('Error triggering TEE task:', error);
      throw new Error(`Failed to trigger TEE task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTaskStatus(taskId: string): Promise<TEETaskResult> {
    if (!this.iexec || !this.isInitialized) {
      throw new Error('iExec service not initialized');
    }

    try {
      console.log(`Checking task status for: ${taskId}`);
      const task = await this.iexec.task.show(taskId);
      console.log(`Task status: ${task.statusName}`, task);
      const deal = await this.iexec.deal.show(task.dealid);
      
      let status: TEETaskResult['status'] = 'pending';
      let result: ScoringResult | undefined;

      // Map iExec task status to our status
      switch (task.statusName) {
        case 'ACTIVE':
        case 'REVEALING':
          status = 'running';
          break;
        case 'COMPLETED':
          status = 'completed';
          // Fetch result if available
          if (task.results && typeof task.results === 'object' && task.results.location) {
            try {
              const resultContent = await this.fetchTaskResult(task.results.location);
              result = this.parseTaskResult(resultContent);
            } catch (error) {
              console.error('Error fetching task result:', error);
            }
          }
          break;
        case 'FAILED':
        case 'TIMEOUT':
          status = 'failed';
          break;
        default:
          status = 'pending';
      }

      return {
        taskId,
        dealId: task.dealid,
        status,
        result,
        createdAt: new Date(Number(deal.startTime) * 1000).getTime(),
        completedAt: (task as any).finalizedTime ? new Date(Number((task as any).finalizedTime) * 1000).getTime() : undefined,
      };
    } catch (error) {
      console.error('Error getting task status:', error);
      throw new Error(`Failed to get task status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTaskProof(taskId: string): Promise<VerificationResult> {
    if (!this.iexec || !this.isInitialized) {
      throw new Error('iExec service not initialized');
    }

    try {
      const task = await this.iexec.task.show(taskId);
      
      const taskAny = task as any;
      const resultsObj = typeof task.results === 'object' ? task.results as any : null;
      
      const proof: TaskProof = {
        taskId,
        dealId: task.dealid,
        workerAddress: taskAny.worker || '0x0000000000000000000000000000000000000000',
        consensusValue: taskAny.consensus || '0x',
        resultHash: resultsObj?.hash || '0x',
        resultLink: resultsObj?.location || '',
        teeSignature: resultsObj?.signature || '0x',
      };

      const isValid = task.statusName === 'COMPLETED' && !!resultsObj?.hash;

      return {
        isValid,
        proofData: proof,
        verificationTimestamp: Date.now(),
        details: {
          consensusReached: !!taskAny.consensus,
          resultAvailable: !!resultsObj?.location,
          signatureValid: !!resultsObj?.signature,
        },
      };
    } catch (error) {
      console.error('Error getting task proof:', error);
      throw new Error(`Failed to get task proof: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async pollTaskUntilComplete(taskId: string, onUpdate?: (task: TEETaskResult) => void): Promise<TEETaskResult> {
    const maxPolls = 180; // 9 minutes at 3-second intervals  
    const pollInterval = 3000; // 3 seconds

    // Wait a bit before starting to poll to allow task to be created on blockchain
    if (pollInterval > 0) {
      console.log('⏳ Deal created successfully! Waiting 5 seconds for task to be initialized...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    for (let i = 0; i < maxPolls; i++) {
      try {
        const task = await this.getTaskStatus(taskId);
        
        if (onUpdate) {
          onUpdate(task);
        }

        if (task.status === 'completed' || task.status === 'failed') {
          return task;
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error(`Polling attempt ${i + 1} failed:`, error);
        if (i === maxPolls - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error('Task polling timeout - task may still be running');
  }

  getExplorerUrl(taskId: string): string {
    return `https://explorer.iex.ec/bellecour/task/${taskId}`;
  }

  getDealExplorerUrl(dealId: string): string {
    return `https://explorer.iex.ec/bellecour/deal/${dealId}`;
  }

  isConnected(): boolean {
    return this.isInitialized && !!this.iexec;
  }

  async getWalletAddress(): Promise<string> {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }
    const signer = await this.provider.getSigner();
    return await signer.getAddress();
  }

  private async switchToBellecour(): Promise<void> {
    try {
      // First try to switch to the network if it exists
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x86' }], // 134 in hex
      });
    } catch (switchError: any) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x86', // 134 in hex
              chainName: 'iExec Bellecour',
              nativeCurrency: {
                name: 'RLC',
                symbol: 'RLC',
                decimals: 9,
              },
              rpcUrls: ['https://bellecour.iex.ec'],
              blockExplorerUrls: ['https://blockscout.bellecour.iex.ec'],
            }],
          });
        } catch (addError) {
          throw new Error('Failed to add iExec Bellecour network to MetaMask');
        }
      } else {
        throw new Error('Failed to switch to iExec Bellecour network');
      }
    }
  }

  // Private helper methods

  private async getAppOrder(appAddress: string): Promise<any> {
    if (!this.iexec) throw new Error('iExec not initialized');
    
    try {
      console.log('Fetching app orders for:', appAddress);
      
      // Try to fetch existing app order from orderbook
      const appOrders = await this.iexec.orderbook.fetchAppOrderbook(appAddress);
      console.log('App orders found:', appOrders.orders?.length || 0);
      
      if (appOrders.orders && appOrders.orders.length > 0) {
        // Log all available orders
        appOrders.orders.forEach((orderEntry: any, index: number) => {
          console.log(`App order ${index}:`, {
            app: orderEntry.order.app,
            price: orderEntry.order.appprice,
            volume: orderEntry.order.volume,
            tag: orderEntry.order.tag,
            remaining: orderEntry.remaining
          });
        });
        
        // Find cheapest available app order with remaining volume
        const availableOrders = appOrders.orders.filter((orderEntry: any) => 
          parseInt(orderEntry.remaining) > 0
        );
        
        if (availableOrders.length > 0) {
          // Sort by price (cheapest first)
          const sortedOrders = availableOrders.sort((a: any, b: any) => 
            parseInt(a.order.appprice || '0') - parseInt(b.order.appprice || '0')
          );
          
          const selectedOrder = sortedOrders[0].order;
          console.log('Selected app order:', selectedOrder);
          return selectedOrder;
        }
        
        // If no orders with remaining volume, use first order anyway
        console.log('No orders with remaining volume, using first order');
        return appOrders.orders[0].order;
      }
    } catch (error) {
      console.error('Error fetching app orders:', error);
    }
    
    throw new Error(`No app orders found for ${appAddress}. Please contact the app owner to publish orders on the iExec marketplace, or create orders using the iExec CLI with the app owner's wallet.`);
  }

  private async getWorkerpoolOrder(): Promise<any> {
    if (!this.iexec) throw new Error('iExec not initialized');
    
    try {
      console.log('Fetching TEE workerpool orders...');
      
      // First try to get the debug TEE workerpool specifically
      const debugWorkerpoolAddress = 'debug-v8-learn.main.pools.iexec.eth';
      
      try {
        console.log(`Trying debug TEE workerpool: ${debugWorkerpoolAddress}`);
        const debugOrders = await this.iexec.orderbook.fetchWorkerpoolOrderbook({ workerpool: debugWorkerpoolAddress });
        
        if (debugOrders.orders && debugOrders.orders.length > 0) {
          console.log('Debug TEE workerpool orders found:', debugOrders.orders.length);
          const availableDebugOrders = debugOrders.orders.filter((orderEntry: any) => {
            const remaining = parseInt(orderEntry.remaining || '0');
            const category = parseInt(orderEntry.order.category || '0');
            const tag = orderEntry.order.tag || '0x0000000000000000000000000000000000000000000000000000000000000000';
            
            // Check for TEE bits in tag
            const tagBigInt = BigInt(tag);
            const hasTeeTag = (tagBigInt & BigInt('0x3')) !== BigInt('0');
            
            console.log(`Debug workerpool order - category: ${category}, tag: ${tag}, remaining: ${remaining}, hasTeeTag: ${hasTeeTag}`);
            return remaining > 0 && hasTeeTag; // Any category with TEE capability
          });
          
          if (availableDebugOrders.length > 0) {
            console.log('Using debug TEE workerpool order');
            return availableDebugOrders[0].order;
          }
        }
      } catch (debugError) {
        console.log('Debug workerpool not available, trying general TEE search:', debugError);
      }
      
      // Search for any available TEE workerpools (category 5)
      const workerpoolOrders = await this.iexec.orderbook.fetchWorkerpoolOrderbook();
      console.log('All workerpool orders found:', workerpoolOrders.orders?.length || 0);
      
      if (workerpoolOrders.orders && workerpoolOrders.orders.length > 0) {
        // Filter for TEE workerpools (any category with TEE tag)
        const teeOrders = workerpoolOrders.orders.filter((orderEntry: any) => {
          const order = orderEntry.order;
          const remaining = parseInt(orderEntry.remaining || '0');
          const category = parseInt(order.category || '0');
          const tag = order.tag || '0x0000000000000000000000000000000000000000000000000000000000000000';
          
          // Check for TEE bits in tag (0x1 for TEE, 0x2 for SCONE)
          const tagBigInt = BigInt(tag);
          const hasTeeTag = (tagBigInt & BigInt('0x3')) !== BigInt('0'); // TEE (0x1) or SCONE (0x2)
          
          console.log(`Workerpool ${order.workerpool}: category=${category}, tag=${tag}, remaining=${remaining}, hasTeeTag=${hasTeeTag}`);
          
          // Accept any category (0, 3, 5) as long as it has TEE capability
          return remaining > 0 && hasTeeTag;
        });
        
        console.log('TEE workerpool orders found:', teeOrders.length);
        
        if (teeOrders.length > 0) {
          // Sort by price (lowest first)
          const sortedOrders = teeOrders.sort((a: any, b: any) => 
            parseInt(a.order.workerpoolprice || '0') - parseInt(b.order.workerpoolprice || '0')
          );
          
          const selectedOrder = sortedOrders[0].order;
          console.log('Selected TEE workerpool order:', selectedOrder);
          return selectedOrder;
        }
        
        // Log available non-TEE workerpools for debugging
        const nonTeeOrders = workerpoolOrders.orders.filter((orderEntry: any) => {
          const order = orderEntry.order;
          const remaining = parseInt(orderEntry.remaining || '0');
          const tag = order.tag || '0x0000000000000000000000000000000000000000000000000000000000000000';
          const tagBigInt = BigInt(tag);
          const hasTeeTag = (tagBigInt & BigInt('0x3')) !== BigInt('0');
          
          return remaining > 0 && !hasTeeTag;
        });
        
        console.log(`Found ${nonTeeOrders.length} non-TEE workerpools, but TEE app requires TEE capability`);
        if (nonTeeOrders.length > 0) {
          console.log('Sample non-TEE workerpool:', nonTeeOrders[0].order.workerpool);
        }
      }
    } catch (error) {
      console.error('Error fetching TEE workerpool orders:', error);
    }
    
    throw new Error('No TEE-enabled workerpools with the required capabilities (TEE+SCONE tags) are currently available on the Bellecour network. TEE infrastructure may be temporarily offline. Please try again later or contact iExec support.');
  }

  private async getDatasetOrder(datasetAddress: string): Promise<any> {
    if (!this.iexec) throw new Error('iExec not initialized');
    
    try {
      // Try to fetch existing dataset order from owner
      const datasetOrders = await this.iexec.orderbook.fetchDatasetOrderbook(datasetAddress);
      if (datasetOrders.orders && datasetOrders.orders.length > 0) {
        // Find free dataset order
        const freeOrder = datasetOrders.orders.find((orderEntry: any) => 
          orderEntry.order.datasetprice === '0' || orderEntry.order.datasetprice === 0
        );
        if (freeOrder) {
          return freeOrder.order;
        }
        // Return first available order
        return datasetOrders.orders[0].order;
      }
    } catch (error) {
      console.warn('No dataset orders found in orderbook:', error);
    }

    throw new Error(`No available orders found for protected data ${datasetAddress}. Please ensure the data owner has published orders.`);
  }

  private async fetchTaskResult(resultUrl: string): Promise<string> {
    try {
      const response = await fetch(resultUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error fetching task result:', error);
      throw error;
    }
  }

  private parseTaskResult(resultContent: string): ScoringResult {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(resultContent);
      return parsed as ScoringResult;
    } catch (error) {
      // If not JSON, try to extract numeric result
      console.warn('Result not in JSON format, attempting to parse as numeric');
      const numericResult = parseFloat(resultContent.trim());
      
      return {
        scoring_logic: "A * 2",
        result: isNaN(numericResult) ? 0 : numericResult,
        status: 'success',
        data_source: 'protected_data'
      };
    }
  }
}

export const iexecService = new IExecService();