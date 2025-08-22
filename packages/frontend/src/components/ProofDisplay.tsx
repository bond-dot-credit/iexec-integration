/**
 * Component for displaying cryptographic proofs and verification results
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  Copy,
  FileText,
  Lock,
  Hash,
  Clock,
  User,
  AlertCircle
} from 'lucide-react';
import { VerificationResult } from '../types/iexec';
import { iexecService } from '../services/iexecService';

interface ProofDisplayProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProofDisplay: React.FC<ProofDisplayProps> = ({ taskId, isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [proof, setProof] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string>('');

  useEffect(() => {
    if (isOpen && taskId) {
      fetchProof();
    } else {
      setProof(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, taskId]);

  const fetchProof = async () => {
    if (!taskId) return;

    setIsLoading(true);
    setError(null);

    try {
      const verificationResult = await iexecService.getTaskProof(taskId);
      setProof(verificationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch proof');
      console.error('Error fetching proof:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(label);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatHash = (hash: string) => {
    if (hash.length > 20) {
      return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
    }
    return hash;
  };

  const getVerificationStatusColor = (isValid: boolean) => {
    return isValid 
      ? 'bg-green-50 border-green-200 text-green-800' 
      : 'bg-red-50 border-red-200 text-red-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Shield className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Cryptographic Proof</h2>
                <p className="text-sm text-gray-600">TEE execution verification and integrity proof</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-600">Fetching verification proof...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-800">Error Loading Proof</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {proof && (
            <div className="space-y-6">
              
              {/* Verification Status */}
              <div className={`p-4 rounded-lg border ${getVerificationStatusColor(proof.isValid)}`}>
                <div className="flex items-center gap-3">
                  {proof.isValid ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                  <div>
                    <h3 className="font-semibold">
                      {proof.isValid ? 'Verification Successful' : 'Verification Failed'}
                    </h3>
                    <p className="text-sm opacity-90">
                      {proof.isValid 
                        ? 'Task execution has been cryptographically verified'
                        : 'Task verification encountered issues'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Verification Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-3 rounded-lg border ${
                  proof.details.consensusReached ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {proof.details.consensusReached ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">Consensus</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {proof.details.consensusReached ? 'Reached' : 'Not Reached'}
                  </p>
                </div>

                <div className={`p-3 rounded-lg border ${
                  proof.details.resultAvailable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {proof.details.resultAvailable ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">Result</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {proof.details.resultAvailable ? 'Available' : 'Unavailable'}
                  </p>
                </div>

                <div className={`p-3 rounded-lg border ${
                  proof.details.signatureValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {proof.details.signatureValid ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">TEE Signature</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {proof.details.signatureValid ? 'Valid' : 'Invalid'}
                  </p>
                </div>
              </div>

              {/* Proof Data */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Proof Data
                </h4>
                
                <div className="space-y-4">
                  {/* Task Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <Hash className="h-4 w-4" />
                        Task ID
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-sm font-mono">
                          {formatHash(proof.proofData.taskId)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(proof.proofData.taskId, 'Task ID')}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copy full Task ID"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <Hash className="h-4 w-4" />
                        Deal ID
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-sm font-mono">
                          {formatHash(proof.proofData.dealId)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(proof.proofData.dealId, 'Deal ID')}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copy full Deal ID"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Worker Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <User className="h-4 w-4" />
                      TEE Worker Address
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-sm font-mono">
                        {proof.proofData.workerAddress}
                      </code>
                      <button
                        onClick={() => copyToClipboard(proof.proofData.workerAddress, 'Worker Address')}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy Worker Address"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Cryptographic Hashes */}
                  {proof.proofData.consensusValue && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <Lock className="h-4 w-4" />
                        Consensus Value
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-sm font-mono">
                          {proof.proofData.consensusValue}
                        </code>
                        <button
                          onClick={() => copyToClipboard(proof.proofData.consensusValue, 'Consensus Value')}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copy Consensus Value"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {proof.proofData.resultHash && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <Hash className="h-4 w-4" />
                        Result Hash
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-sm font-mono">
                          {proof.proofData.resultHash}
                        </code>
                        <button
                          onClick={() => copyToClipboard(proof.proofData.resultHash, 'Result Hash')}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copy Result Hash"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TEE Signature */}
                  {proof.proofData.teeSignature && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <Shield className="h-4 w-4" />
                        TEE Signature
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-sm font-mono break-all">
                          {proof.proofData.teeSignature}
                        </code>
                        <button
                          onClick={() => copyToClipboard(proof.proofData.teeSignature!, 'TEE Signature')}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copy TEE Signature"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Result Link */}
                  {proof.proofData.resultLink && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <ExternalLink className="h-4 w-4" />
                        Result Storage Link
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-sm font-mono break-all">
                          {proof.proofData.resultLink}
                        </code>
                        <a
                          href={proof.proofData.resultLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-indigo-600 hover:text-indigo-700 transition-colors"
                          title="Open Result Link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Verification Timestamp */}
              <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Verification Time: {new Date(proof.verificationTimestamp).toLocaleString()}</span>
                </div>
              </div>

              {/* Copy Success Notification */}
              {copySuccess && (
                <div className="p-2 bg-green-100 border border-green-300 rounded text-sm text-green-800 text-center">
                  {copySuccess} copied to clipboard!
                </div>
              )}

              {/* Security Information */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">Verification Details:</p>
                    <ul className="text-blue-700 space-y-1 text-xs">
                      <li>• Task executed in Intel SGX Trusted Execution Environment</li>
                      <li>• Results cryptographically signed by TEE worker</li>
                      <li>• Consensus mechanism ensures execution integrity</li>
                      <li>• All data processed in confidential computing environment</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};