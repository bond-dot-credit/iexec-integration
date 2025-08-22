/**
 * Component for triggering TEE tasks with the scoring logic
 */

import React, { useState } from 'react';
import { Play, Shield, Database, Loader2, AlertCircle } from 'lucide-react';
import { TriggerTEETaskParams, FormErrors, DEPLOYED_ADDRESSES } from '../types/iexec';
import { iexecService } from '../services/iexecService';

interface TriggerTEETaskProps {
  onTaskTriggered: (task: any) => void;
  disabled?: boolean;
}

export const TriggerTEETask: React.FC<TriggerTEETaskProps> = ({ onTaskTriggered, disabled = false }) => {
  const [inputValue, setInputValue] = useState<number>(42);
  const [useProtectedData, setUseProtectedData] = useState<boolean>(true);
  const [protectedDataAddress, setProtectedDataAddress] = useState<string>(DEPLOYED_ADDRESSES.PROTECTED_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!inputValue && !useProtectedData) {
      newErrors.inputValue = 'Input value is required when not using protected data';
    }

    if (inputValue < 1 || inputValue > 1000000) {
      newErrors.inputValue = 'Input value must be between 1 and 1,000,000';
    }

    if (useProtectedData && (!protectedDataAddress || !protectedDataAddress.startsWith('0x'))) {
      newErrors.protectedDataAddress = 'Valid protected data address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || disabled || isLoading) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const params: TriggerTEETaskParams = {
        inputValue,
        useProtectedData,
        protectedDataAddress: useProtectedData ? protectedDataAddress : undefined,
      };

      const task = await iexecService.triggerTEETask(params);
      onTaskTriggered(task);
      
      // Reset form on success
      if (!useProtectedData) {
        setInputValue(42);
      }

    } catch (error) {
      console.error('Error triggering task:', error);
      setErrors({ 
        general: error instanceof Error ? error.message : 'Failed to trigger TEE task' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary-50 rounded-lg">
          <Play className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Trigger TEE Task</h2>
          <p className="text-sm text-gray-600">Execute scoring logic in Trusted Execution Environment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Data Source Selection */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-gray-700">Data Source</label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                useProtectedData 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
              onClick={() => setUseProtectedData(true)}
            >
              <div className="flex items-center gap-3">
                <Shield className={`h-5 w-5 ${useProtectedData ? 'text-primary-600' : 'text-gray-400'}`} />
                <div>
                  <div className="font-medium text-gray-900">Protected Data</div>
                  <div className="text-xs text-gray-600">Use encrypted data from iExec storage</div>
                </div>
              </div>
              <input 
                type="radio" 
                checked={useProtectedData} 
                onChange={() => setUseProtectedData(true)}
                className="absolute top-4 right-4"
              />
            </div>

            <div 
              className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                !useProtectedData 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
              onClick={() => setUseProtectedData(false)}
            >
              <div className="flex items-center gap-3">
                <Database className={`h-5 w-5 ${!useProtectedData ? 'text-primary-600' : 'text-gray-400'}`} />
                <div>
                  <div className="font-medium text-gray-900">Test Data</div>
                  <div className="text-xs text-gray-600">Use command line arguments for testing</div>
                </div>
              </div>
              <input 
                type="radio" 
                checked={!useProtectedData} 
                onChange={() => setUseProtectedData(false)}
                className="absolute top-4 right-4"
              />
            </div>
          </div>
        </div>

        {/* Protected Data Address */}
        {useProtectedData && (
          <div className="space-y-2">
            <label htmlFor="protectedDataAddress" className="block text-sm font-medium text-gray-700">
              Protected Data Address
            </label>
            <input
              type="text"
              id="protectedDataAddress"
              value={protectedDataAddress}
              onChange={(e) => setProtectedDataAddress(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm ${
                errors.protectedDataAddress ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0x..."
              disabled={isLoading}
            />
            {errors.protectedDataAddress && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.protectedDataAddress}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Using production protected data: {DEPLOYED_ADDRESSES.PROTECTED_DATA}
            </p>
          </div>
        )}

        {/* Input Value for Test Mode */}
        {!useProtectedData && (
          <div className="space-y-2">
            <label htmlFor="inputValue" className="block text-sm font-medium text-gray-700">
              Test Input Value (A)
            </label>
            <input
              type="number"
              id="inputValue"
              value={inputValue}
              onChange={(e) => setInputValue(parseInt(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.inputValue ? 'border-red-500' : 'border-gray-300'
              }`}
              min="1"
              max="1000000"
              disabled={isLoading}
            />
            {errors.inputValue && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.inputValue}
              </p>
            )}
            <p className="text-xs text-gray-500">
              This value will be processed with scoring logic: result = A * 2
            </p>
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {errors.general}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={disabled || isLoading}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            disabled || isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Triggering TEE Task...
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              Trigger TEE Task
            </>
          )}
        </button>

        {/* Info Panel */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">TEE Security Features:</p>
              <ul className="text-blue-700 space-y-1 text-xs">
                <li>• Confidential computing in trusted execution environment</li>
                <li>• {useProtectedData ? 'Encrypted input data never exposed in results' : 'Test data visible for debugging purposes'}</li>
                <li>• Deterministic scoring logic: result = A * 2</li>
                <li>• Results cryptographically verifiable</li>
              </ul>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};