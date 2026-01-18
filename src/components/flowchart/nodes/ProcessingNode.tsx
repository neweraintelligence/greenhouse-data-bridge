import { memo, useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Cog, Check, AlertTriangle, Activity, Zap, Presentation } from 'lucide-react';

export interface SourceStatus {
  name: string;
  received: boolean;
}

export interface ProcessingNodeData {
  label: string;
  status: 'idle' | 'processing' | 'complete' | 'error';
  progress?: number;
  stats?: {
    processed: number;
    flagged: number;
    errors: number;
  };
  // Source statuses for status messages
  sources?: SourceStatus[];
  onShowInfo?: () => void;
}

interface ProcessingNodeProps {
  data: ProcessingNodeData;
}

// Processing phase messages
const processingMessages = [
  'Analyzing data structures...',
  'Cross-referencing records...',
  'Validating field mappings...',
  'Reconciling discrepancies...',
  'Generating output files...',
];

function ProcessingNodeComponent({ data }: ProcessingNodeProps) {
  const isComplete = data.status === 'complete';
  const isProcessing = data.status === 'processing';
  const isIdle = data.status === 'idle';

  // Cycling status message
  const [statusMessage, setStatusMessage] = useState('');
  const [isMessageVisible, setIsMessageVisible] = useState(true);
  const [processingMessageIndex, setProcessingMessageIndex] = useState(0);

  // Generate status messages based on source statuses
  useEffect(() => {
    if (!data.sources || data.sources.length === 0) return;

    const receivedSources = data.sources.filter(s => s.received);
    const pendingSources = data.sources.filter(s => !s.received);

    // During idle, cycle through received/pending messages
    if (isIdle) {
      const messages: string[] = [];

      receivedSources.forEach(s => {
        messages.push(`✓ Received: ${s.name}`);
      });

      pendingSources.forEach(s => {
        messages.push(`◦ Awaiting: ${s.name}`);
      });

      if (messages.length === 0) return;

      let currentIndex = 0;

      const cycleMessage = () => {
        setIsMessageVisible(false);

        setTimeout(() => {
          setStatusMessage(messages[currentIndex]);
          setIsMessageVisible(true);
          currentIndex = (currentIndex + 1) % messages.length;
        }, 300);
      };

      cycleMessage();
      const interval = setInterval(cycleMessage, 2500);

      return () => clearInterval(interval);
    }
  }, [data.sources, isIdle]);

  // Cycle through processing messages
  useEffect(() => {
    if (!isProcessing) return;

    const cycleMessage = () => {
      setIsMessageVisible(false);

      setTimeout(() => {
        setProcessingMessageIndex(prev => (prev + 1) % processingMessages.length);
        setIsMessageVisible(true);
      }, 200);
    };

    const interval = setInterval(cycleMessage, 2000);
    return () => clearInterval(interval);
  }, [isProcessing]);

  return (
    <div
      className={`
        glass-node min-w-[200px] max-w-[260px] overflow-hidden
        ${isComplete ? 'glass-node-active' : ''}
        ${isProcessing ? 'processing-node-active' : ''}
      `}
    >
      <Handle type="target" position={Position.Left} className="!bg-white !border-2 !border-gray-400 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-white !border-2 !border-bmf-blue !w-3 !h-3" />

      {/* Header */}
      <div
        className={`
          px-4 py-2.5 relative overflow-hidden
          ${isProcessing
            ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] animate-gradient-shift'
            : isComplete
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
              : data.status === 'error'
                ? 'bg-gradient-to-r from-red-500 to-red-600'
                : 'bg-gradient-to-r from-slate-600 to-slate-700'
          }
        `}
      >
        <div className="flex items-center justify-between w-full relative z-10">
          <div className="flex items-center gap-2">
            {isProcessing ? (
              <div className="relative">
                <Activity className="w-4 h-4 text-white animate-pulse" />
                <div className="absolute inset-0 animate-ping">
                  <Zap className="w-4 h-4 text-white/50" />
                </div>
              </div>
            ) : isComplete ? (
              <Check className="w-4 h-4 text-white" />
            ) : data.status === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-white" />
            ) : (
              <Cog className="w-4 h-4 text-white" />
            )}
            <span className="text-sm font-medium text-white">{data.label}</span>
          </div>
          <div className="ml-4">
          {data.onShowInfo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onShowInfo?.();
              }}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
              title="Present this node"
            >
              <Presentation className="w-3.5 h-3.5 text-white" />
            </button>
          )}
          </div>
        </div>

        {/* Shimmer effect during processing */}
        {isProcessing && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        )}
      </div>

      {/* Content */}
      <div className="p-4 bg-white/90">
        {/* Idle state - waiting for data with status cycling */}
        {isIdle && (
          <div className="space-y-3">
            <div className="text-center">
              <div className="relative w-12 h-12 mx-auto mb-2">
                <Cog className="w-12 h-12 text-gray-200" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-slate-400 rounded-full animate-pulse" />
                </div>
              </div>
              <p className="text-xs text-gray-500 font-medium">Monitoring inputs...</p>
            </div>

            {/* Fading status message */}
            {statusMessage && (
              <div
                className={`
                  text-center py-2 px-3 rounded-lg bg-slate-50 border border-slate-100
                  transition-opacity duration-300 ease-in-out
                  ${isMessageVisible ? 'opacity-100' : 'opacity-0'}
                `}
              >
                <p className={`text-xs ${statusMessage.startsWith('✓') ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {statusMessage}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Processing state with progress and cycling messages */}
        {isProcessing && (
          <div className="space-y-3">
            {/* Animated processing indicator */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-100 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-indigo-600">
                    {Math.round(data.progress || 0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 rounded-full"
                style={{ width: `${data.progress || 0}%` }}
              />
            </div>

            {/* Cycling status message */}
            <div
              className={`
                text-center transition-opacity duration-200 ease-in-out min-h-[20px]
                ${isMessageVisible ? 'opacity-100' : 'opacity-0'}
              `}
            >
              <p className="text-xs text-indigo-600 font-medium">
                {processingMessages[processingMessageIndex]}
              </p>
            </div>
          </div>
        )}

        {/* Complete state with stats */}
        {isComplete && data.stats && (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50">
              <span className="text-xs text-gray-600">Records Processed</span>
              <span className="text-sm font-bold text-emerald-600">{data.stats.processed}</span>
            </div>
            {data.stats.flagged > 0 && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50">
                <span className="text-xs text-gray-600">Flagged for Review</span>
                <span className="text-sm font-bold text-amber-600">{data.stats.flagged}</span>
              </div>
            )}
            {data.stats.errors > 0 && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-red-50">
                <span className="text-xs text-gray-600">Errors</span>
                <span className="text-sm font-bold text-red-600">{data.stats.errors}</span>
              </div>
            )}
            <div className="text-center pt-1">
              <p className="text-[10px] text-emerald-600 font-medium">✓ Processing complete</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {data.status === 'error' && (
          <div className="text-center py-2">
            <AlertTriangle className="w-10 h-10 text-red-300 mx-auto mb-2" />
            <p className="text-xs text-red-500 font-medium">Processing failed</p>
            <p className="text-[10px] text-gray-400 mt-1">Check inputs and retry</p>
          </div>
        )}
      </div>
    </div>
  );
}

export const ProcessingNode = memo(ProcessingNodeComponent);
