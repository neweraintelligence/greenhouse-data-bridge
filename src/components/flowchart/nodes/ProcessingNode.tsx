import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Cog, Loader2, Check, AlertTriangle, Sparkles } from 'lucide-react';

export interface ProcessingNodeData {
  label: string;
  status: 'idle' | 'processing' | 'complete' | 'error';
  progress?: number;
  stats?: {
    processed: number;
    flagged: number;
    errors: number;
  };
}

interface ProcessingNodeProps {
  data: ProcessingNodeData;
}

function ProcessingNodeComponent({ data }: ProcessingNodeProps) {
  const isComplete = data.status === 'complete';
  const isProcessing = data.status === 'processing';

  return (
    <div
      className={`
        glass-node min-w-[180px] overflow-hidden
        ${isComplete ? 'glass-node-active' : ''}
        ${isProcessing ? 'ai-processing' : ''}
      `}
    >
      <Handle type="target" position={Position.Left} className="!bg-white !border-2 !border-gray-400 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-white !border-2 !border-bmf-blue !w-3 !h-3" />

      {/* Header */}
      <div
        className={`
          px-4 py-2.5
          ${isProcessing
            ? 'bg-gradient-to-r from-ai-purple to-indigo-600'
            : isComplete
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
              : data.status === 'error'
                ? 'bg-gradient-to-r from-red-500 to-red-600'
                : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
          }
        `}
      >
        <div className="flex items-center gap-2">
          {isProcessing ? (
            <>
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </>
          ) : isComplete ? (
            <Check className="w-4 h-4 text-white" />
          ) : data.status === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-white" />
          ) : (
            <Cog className="w-4 h-4 text-white" />
          )}
          <span className="text-sm font-medium text-white">{data.label}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-white/80">
        {data.status === 'idle' && (
          <div className="text-center py-2">
            <Cog className="w-8 h-8 text-gray-300 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Waiting for data...</p>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-ai-purple">
              <Sparkles className="w-3 h-3" />
              <span>AI Processing...</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-ai-purple to-indigo-500 transition-all duration-300"
                style={{ width: `${data.progress || 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              {Math.round(data.progress || 0)}% complete
            </p>
          </div>
        )}

        {isComplete && data.stats && (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50">
              <span className="text-xs text-gray-600">Processed</span>
              <span className="text-sm font-semibold text-emerald-600">{data.stats.processed}</span>
            </div>
            {data.stats.flagged > 0 && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50">
                <span className="text-xs text-gray-600">Flagged for Review</span>
                <span className="text-sm font-semibold text-amber-600">{data.stats.flagged}</span>
              </div>
            )}
            {data.stats.errors > 0 && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-red-50">
                <span className="text-xs text-gray-600">Errors</span>
                <span className="text-sm font-semibold text-red-600">{data.stats.errors}</span>
              </div>
            )}
          </div>
        )}

        {data.status === 'error' && (
          <div className="text-center py-2">
            <AlertTriangle className="w-8 h-8 text-red-300 mx-auto mb-1" />
            <p className="text-xs text-red-500">Processing failed</p>
          </div>
        )}
      </div>
    </div>
  );
}

export const ProcessingNode = memo(ProcessingNodeComponent);
