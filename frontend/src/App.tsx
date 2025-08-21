/**
 * Main App component for iExec TEE Scoring Logic Frontend
 */

import React, { useState, useEffect } from 'react';
import { Shield, Activity, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { TriggerTEETask } from './components/TriggerTEETask';
import { ScoreDisplay } from './components/ScoreDisplay';
import { ProofDisplay } from './components/ProofDisplay';
import { TEETaskResult } from './types/iexec';
import { iexecService } from './services/iexecService';
import './App.css';

function App() {
  const [currentTask, setCurrentTask] = useState<TEETaskResult | null>(null);
  const [taskHistory, setTaskHistory] = useState<TEETaskResult[]>([]);
  const [selectedProofTaskId, setSelectedProofTaskId] = useState<string | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false);
  const [isCreatingOrders, setIsCreatingOrders] = useState(false);

  useEffect(() => {
    initializeService();
  }, []);

  const initializeService = async () => {
    setIsInitializing(true);
    setConnectionError(null);
    setIsNetworkSwitching(false);

    try {
      await iexecService.initialize();
      const address = await iexecService.getWalletAddress();
      setWalletAddress(address);
      setIsConnected(true);
      console.log('iExec service initialized successfully with wallet:', address);
    } catch (error) {
      console.error('Failed to initialize iExec service:', error);
      
      // Check if it's a network switching issue
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to iExec network';
      if (errorMessage.includes('Chain ID')) {
        setIsNetworkSwitching(true);
      }
      
      setConnectionError(errorMessage);
      setIsConnected(false);
      setWalletAddress(null);
    } finally {
      setIsInitializing(false);
    }
  };

  const createOrders = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsCreatingOrders(true);
    try {
      console.log('Creating app order...');
      const appOrder = await (iexecService as any).iexec.order.createApporder({
        app: '0x5eC82059CbF38C005B73e70220a5192B19E7A12c',
        appprice: 0,
        volume: 1000,
        tag: '0x0000000000000000000000000000000000000000000000000000000000000003'
      });

      const signedAppOrder = await (iexecService as any).iexec.order.signApporder(appOrder);
      const appOrderHash = await (iexecService as any).iexec.order.publishApporder(signedAppOrder);
      console.log('App order created:', appOrderHash);

      console.log('Creating dataset order...');
      try {
        const datasetOrder = await (iexecService as any).iexec.order.createDatasetorder({
          dataset: '0xedEE98aA169B6685625c7a8b5bd5C8ece41B4BB6',
          datasetprice: 0,
          volume: 1000
        });
        console.log('Dataset order created:', datasetOrder);

        const signedDatasetOrder = await (iexecService as any).iexec.order.signDatasetorder(datasetOrder);
        console.log('Dataset order signed:', signedDatasetOrder);

        const datasetOrderHash = await (iexecService as any).iexec.order.publishDatasetorder(signedDatasetOrder);
        console.log('Dataset order published:', datasetOrderHash);
      } catch (datasetError) {
        console.error('Dataset order creation failed:', datasetError);
        // Continue anyway - app order is more important
        console.log('Continuing without dataset order - will try test mode instead');
      }

      alert('App order created successfully! You can now trigger TEE tasks with test data. (Dataset order creation had issues but app order works)');
    } catch (error) {
      console.error('Error creating orders:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.stack);
      }
      alert(`Error during order creation: ${error instanceof Error ? error.message : 'Unknown error'}. Check console for details.`);
    } finally {
      setIsCreatingOrders(false);
    }
  };

  const handleTaskTriggered = (task: TEETaskResult) => {
    setCurrentTask(task);
    setTaskHistory(prev => [task, ...prev.slice(0, 9)]); // Keep last 10 tasks
  };

  const handleTaskUpdate = (updatedTask: TEETaskResult) => {
    setCurrentTask(updatedTask);
    
    // Update task in history
    setTaskHistory(prev => 
      prev.map(task => 
        task.taskId === updatedTask.taskId ? updatedTask : task
      )
    );
  };

  const handleViewProof = (taskId: string) => {
    setSelectedProofTaskId(taskId);
    setIsProofModalOpen(true);
  };

  const handleCloseProofModal = () => {
    setIsProofModalOpen(false);
    setSelectedProofTaskId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Shield className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">iExec TEE Scoring Logic</h1>
                <p className="text-sm text-gray-600">Confidential Computing Interface</p>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center gap-4">
              {/* Wallet Address */}
              {walletAddress && (
                <div className="text-right">
                  <div className="text-xs text-gray-500">Wallet</div>
                  <code className="text-xs font-mono text-gray-700">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </code>
                </div>
              )}
              
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                {(isInitializing || isNetworkSwitching) ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-full">
                    <Activity className="h-4 w-4 text-yellow-600 animate-pulse" />
                    <span className="text-sm text-yellow-700">
                      {isNetworkSwitching ? 'Switching networks...' : 'Connecting...'}
                    </span>
                  </div>
                ) : isConnected ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                    <Wifi className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-full">
                    <WifiOff className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-700">Disconnected</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Connection Error */}
        {connectionError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-800">Connection Error</h3>
                <p className="text-sm text-red-700 mt-1">{connectionError}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={initializeService}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    Retry Connection
                  </button>
                  {connectionError?.includes('Chain ID') && (
                    <button
                      onClick={() => {
                        setIsNetworkSwitching(true);
                        initializeService();
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Switch Network
                    </button>
                  )}
                  {/* Debug info */}
                  {isConnected && (
                    <div className="text-xs text-gray-500 mt-1">
                      Connected: {walletAddress}<br/>
                      Is Owner: {walletAddress?.toLowerCase() === '0x2a724fff23fa9a8949aac705a3ff39cef4ce70b1' ? 'Yes' : 'No'}
                    </div>
                  )}
                  {isConnected && walletAddress?.toLowerCase() === '0x2a724fff23fa9a8949aac705a3ff39cef4ce70b1' && (
                    <button
                      onClick={createOrders}
                      disabled={isCreatingOrders}
                      className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                    >
                      {isCreatingOrders ? 'Creating Orders...' : '🔧 Create Orders (Owner Only)'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-full mb-4">
            <Shield className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700">Trusted Execution Environment</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Secure Credit Score Processing</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Execute scoring logic on encrypted data using iExec's decentralized confidential computing platform. 
            Your sensitive data is protected by Intel SGX TEE technology.
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Trigger Task */}
          <div className="space-y-6">
            {/* Admin Panel for App Owner */}
            {isConnected && walletAddress?.toLowerCase() === '0x2a724fff23fa9a8949aac705a3ff39cef4ce70b1' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <h3 className="font-medium text-purple-900">App Owner Panel</h3>
                </div>
                <p className="text-sm text-purple-700 mb-3">
                  You're connected as the app owner. Create marketplace orders to enable task execution.
                </p>
                <button
                  onClick={createOrders}
                  disabled={isCreatingOrders}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                >
                  {isCreatingOrders ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating Orders...
                    </>
                  ) : (
                    <>
                      🔧 Create Marketplace Orders
                    </>
                  )}
                </button>
              </div>
            )}
            
            <TriggerTEETask 
              onTaskTriggered={handleTaskTriggered}
              disabled={!isConnected || isInitializing}
            />

            {/* Task History */}
            {taskHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h3>
                <div className="space-y-2">
                  {taskHistory.slice(0, 5).map((task) => (
                    <div 
                      key={task.taskId}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        currentTask?.taskId === task.taskId
                          ? 'border-indigo-300 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setCurrentTask(task)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            task.status === 'completed' ? 'bg-green-500' :
                            task.status === 'failed' ? 'bg-red-500' :
                            task.status === 'running' ? 'bg-blue-500' :
                            'bg-yellow-500'
                          }`} />
                          <code className="text-sm font-mono">
                            {task.taskId.slice(0, 8)}...{task.taskId.slice(-6)}
                          </code>
                        </div>
                        <span className="text-xs text-gray-500 capitalize">
                          {task.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Results Display */}
          <div>
            <ScoreDisplay
              task={currentTask}
              onViewProof={handleViewProof}
              onTaskUpdate={handleTaskUpdate}
            />
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="h-8 w-8 text-indigo-600" />
              <h3 className="font-semibold text-gray-900">Data Privacy</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Your sensitive data is encrypted client-side and processed in Intel SGX TEE. 
              Input data is never exposed in computation results.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="h-8 w-8 text-green-600" />
              <h3 className="font-semibold text-gray-900">Verifiable Results</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Every computation generates cryptographic proofs that can be independently verified. 
              Consensus mechanisms ensure result integrity.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <Wifi className="h-8 w-8 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Decentralized</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Powered by iExec's decentralized network of TEE workers. 
              No single point of failure or data custody concerns.
            </p>
          </div>
        </div>

        {/* Technical Info */}
        <div className="mt-12 bg-gray-900 rounded-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-3">Technical Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-300 mb-2">Deployed Contracts</h4>
              <div className="space-y-1 font-mono text-xs">
                <div>TEE App: <span className="text-indigo-400">0x5eC82059CbF38C005B73e70220a5192B19E7A12c</span></div>
                <div>Protected Data: <span className="text-green-400">0xedEE98aA169B6685625c7a8b5bd5C8ece41B4BB6</span></div>
                <div>Network: <span className="text-blue-400">iExec Bellecour</span></div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-300 mb-2">Scoring Logic</h4>
              <div className="space-y-1 text-xs">
                <div>Algorithm: <span className="text-yellow-400">result = A * 2</span></div>
                <div>TEE Engine: <span className="text-purple-400">Intel SGX</span></div>
                <div>Consensus: <span className="text-pink-400">PoCo (Proof of Contribution)</span></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Proof Modal */}
      <ProofDisplay
        taskId={selectedProofTaskId}
        isOpen={isProofModalOpen}
        onClose={handleCloseProofModal}
      />
    </div>
  );
}

export default App;