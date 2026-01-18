import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Cog, Loader2, Check, AlertTriangle } from 'lucide-react';

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
  return (
    <div className="bg-white rounded-lg border-2 border-indigo-200 min-w-[160px] shadow-sm">
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <Handle type="source" position={Position.Right} className="!bg-gray-400" />

      {/* Header */}
      <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 rounded-t-lg">
        <div className="flex items-center gap-2">
          {data.status === 'processing' ? (
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
          ) : data.status === 'complete' ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : data.status === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          ) : (
            <Cog className="w-4 h-4 text-indigo-600" />
          )}
          <span className="text-sm font-semibold text-gray-700">{data.label}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {data.status === 'idle' && (
          <p className="text-xs text-gray-500">Waiting for data...</p>
        )}

        {data.status === 'processing' && (
          <div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${data.progress || 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Processing... {Math.round(data.progress || 0)}%</p>
          </div>
        )}

        {data.status === 'complete' && data.stats && (
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Processed</span>
              <span className="font-medium text-gray-800">{data.stats.processed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Flagged</span>
              <span className={`font-medium ${data.stats.flagged > 0 ? 'text-amber-600' : 'text-gray-800'}`}>
                {data.stats.flagged}
              </span>
            </div>
            {data.stats.errors > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Errors</span>
                <span className="font-medium text-red-600">{data.stats.errors}</span>
              </div>
            )}
          </div>
        )}

        {data.status === 'error' && (
          <p className="text-xs text-red-500">Processing failed</p>
        )}
      </div>
    </div>
  );
}

export const ProcessingNode = memo(ProcessingNodeComponent);
