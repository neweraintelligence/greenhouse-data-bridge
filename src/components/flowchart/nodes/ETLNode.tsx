import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { RefreshCw, Check, ArrowRight, Presentation } from 'lucide-react';

export interface TransformationLog {
  field: string;
  original: string;
  transformed: string;
  type: string;
}

export interface ETLNodeData {
  label: string;
  status: 'idle' | 'processing' | 'complete';
  transformations?: TransformationLog[];
  onShowInfo?: () => void;
}

interface ETLNodeProps {
  data: ETLNodeData;
}

function ETLNodeComponent({ data }: ETLNodeProps) {
  const isComplete = data.status === 'complete';
  const isProcessing = data.status === 'processing';

  return (
    <div
      className={`
        glass-node min-w-[220px] max-w-[280px] overflow-hidden
        ${isComplete ? 'glass-node-active' : ''}
      `}
    >
      <Handle type="target" position={Position.Left} className="!bg-white !border-2 !border-gray-400 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-white !border-2 !border-bmf-blue !w-3 !h-3" />

      {/* Header */}
      <div
        className={`
          px-4 py-2.5 relative overflow-hidden
          ${isProcessing
            ? 'bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 bg-[length:200%_100%] animate-gradient-shift'
            : isComplete
              ? 'bg-gradient-to-r from-purple-500 to-violet-600'
              : 'bg-gradient-to-r from-purple-600 to-violet-700'
          }
        `}
      >
        <div className="flex items-center justify-between w-full relative z-10">
          <div className="flex items-center gap-2">
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 text-white animate-spin" />
            ) : isComplete ? (
              <Check className="w-4 h-4 text-white" />
            ) : (
              <RefreshCw className="w-4 h-4 text-white" />
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
      </div>

      {/* Content */}
      <div className="p-4 bg-white/90">
        {/* Idle state */}
        {data.status === 'idle' && (
          <div className="text-center py-2">
            <RefreshCw className="w-10 h-10 text-purple-200 mx-auto mb-2" />
            <p className="text-xs text-gray-500 font-medium">Ready to normalize data</p>
          </div>
        )}

        {/* Processing state */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-center">
              <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
            <p className="text-xs text-purple-600 text-center font-medium">
              Standardizing data formats...
            </p>
          </div>
        )}

        {/* Complete state with transformation log */}
        {isComplete && data.transformations && (
          <div className="space-y-2">
            <div className="text-center mb-3">
              <p className="text-[10px] text-gray-500 mb-1">Transformations Applied</p>
              <p className="text-xl font-bold text-purple-600">{data.transformations.length}</p>
            </div>

            {/* Sample transformations */}
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
              {data.transformations.slice(0, 5).map((t, i) => (
                <div key={i} className="p-2 rounded-lg bg-purple-50 border border-purple-100">
                  <div className="flex items-center justify-between text-[10px] text-gray-600 mb-1">
                    <span className="font-medium">{t.field}</span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-200 text-purple-700">
                      {t.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <code className="px-1.5 py-0.5 bg-white rounded text-gray-600 font-mono truncate max-w-[80px]">
                      {t.original}
                    </code>
                    <ArrowRight className="w-3 h-3 text-purple-500 shrink-0" />
                    <code className="px-1.5 py-0.5 bg-white rounded text-purple-700 font-mono font-semibold truncate max-w-[80px]">
                      {t.transformed}
                    </code>
                  </div>
                </div>
              ))}
            </div>

            {data.transformations.length > 5 && (
              <p className="text-[10px] text-center text-gray-400 mt-2">
                +{data.transformations.length - 5} more transformations
              </p>
            )}

            <div className="text-center pt-2">
              <p className="text-[10px] text-purple-600 font-medium">✓ Data normalized</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const ETLNode = memo(ETLNodeComponent);
