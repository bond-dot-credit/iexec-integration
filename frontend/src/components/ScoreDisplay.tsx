/**
 * Component for displaying scoring results and task status
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2, 
  ExternalLink, 
  Shield,
  Eye,
  Copy,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { TEETaskResult, ScoringResult } from '../types/iexec';
import { iexecService } from '../services/iexecService';

interface ScoreDisplayProps {
  task: TEETaskResult | null;
  onViewProof: (taskId: string) => void;
  onTaskUpdate?: (task: TEETaskResult) => void;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ task, onViewProof, onTaskUpdate }) => {
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [copySuccess, setCopySuccess] = useState<string>('');

  useEffect(() => {
    if (task && (task.status === 'pending' || task?.status === 'running')) {
      startPolling();
    } else {
      setIsPolling(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);

  const startPolling = async () => {
    if (!task || isPolling) return;
    
    setIsPolling(true);
    try {
      const updatedTask = await iexecService.pollTaskUntilComplete(
        task.taskId,
        (updateTask) => {
          if (onTaskUpdate) {
            onTaskUpdate(updateTask);
          }
          setLastUpdated(Date.now());
        }
      );
      
      if (onTaskUpdate) {
        onTaskUpdate(updatedTask);
      }
    } catch (error) {
      console.error('Polling error:', error);
    } finally {
      setIsPolling(false);
    }
  };

  const refreshTask = async () => {
    if (!task || isPolling) return;

    setIsPolling(true);
    try {
      const updatedTask = await iexecService.getTaskStatus(task.taskId);
      if (onTaskUpdate) {
        onTaskUpdate(updatedTask);
      }
      setLastUpdated(Date.now());
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsPolling(false);
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

  const getStatusIcon = (status: TEETaskResult['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: TEETaskResult['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'running':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (start: number, end?: number) => {
    const duration = (end || Date.now()) - start;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  if (!task) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No TEE task triggered yet</p>
        <p className="text-sm text-gray-500 mt-1">Results will appear here after triggering a task</p>
      </div>
    );
  }

  const scoringResult = task.result as ScoringResult;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(task.status)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">TEE Task Results</h3>
              <p className="text-sm text-gray-600">
                Status: <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                  {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={refreshTask}
              disabled={isPolling}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh status"
            >
              <RefreshCw className={`h-4 w-4 ${isPolling ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Task Information */}
      <div className="p-6 space-y-4">
        
        {/* Task IDs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task ID</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-mono">
                {task.taskId}
              </code>
              <button
                onClick={() => copyToClipboard(task.taskId, 'Task ID')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy Task ID"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deal ID</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-mono">
                {task.dealId}
              </code>
              <button
                onClick={() => copyToClipboard(task.dealId, 'Deal ID')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy Deal ID"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
            <p className="text-sm text-gray-600">{formatTimestamp(task.createdAt)}</p>
          </div>
          
          {task.completedAt && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Completed</label>
              <p className="text-sm text-gray-600">
                {formatTimestamp(task.completedAt)}
                <span className="text-xs text-gray-500 ml-2">
                  ({formatDuration(task.createdAt, task.completedAt)})
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Scoring Results */}
        {scoringResult && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-blue-900">Scoring Logic Results</h4>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Logic Applied</label>
                  <code className="block px-3 py-2 bg-white border border-blue-200 rounded text-sm font-mono text-gray-900">
                    {scoringResult.scoring_logic}
                  </code>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Result</label>
                  <div className="px-3 py-2 bg-white border border-blue-200 rounded">
                    <span className="text-2xl font-bold text-blue-900">{scoringResult.result}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Data Source</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-white border border-blue-200 rounded">
                    {scoringResult.data_source === 'protected_data' ? (
                      <>
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Protected Data (Encrypted)</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">Test Data (Visible)</span>
                      </>
                    )}
                  </div>
                </div>

                {scoringResult.input_A !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Input Value (A)</label>
                    <code className="block px-3 py-2 bg-white border border-blue-200 rounded text-sm font-mono">
                      {scoringResult.input_A}
                    </code>
                  </div>
                )}
              </div>

              {scoringResult.data_source === 'protected_data' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-green-800 mb-1">Data Privacy Protected</p>
                      <p className="text-green-700 text-xs">
                        Input data was encrypted and processed in TEE. Original value never exposed in results.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {scoringResult.error_message && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-red-800 mb-1">Error</p>
                      <p className="text-red-700">{scoringResult.error_message}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => onViewProof(task.taskId)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Eye className="h-4 w-4" />
            View Proof
          </button>
          
          <a
            href={iexecService.getExplorerUrl(task.taskId)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            View on Explorer
          </a>

          <a
            href={iexecService.getDealExplorerUrl(task.dealId)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            View Deal
          </a>
        </div>

        {/* Copy Success Notification */}
        {copySuccess && (
          <div className="p-2 bg-green-100 border border-green-300 rounded text-sm text-green-800 text-center">
            {copySuccess} copied to clipboard!
          </div>
        )}

        {/* Last Updated */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
          Last updated: {formatTimestamp(lastUpdated)}
          {isPolling && <span className="ml-2">• Auto-refreshing...</span>}
        </div>

      </div>
    </div>
  );
};