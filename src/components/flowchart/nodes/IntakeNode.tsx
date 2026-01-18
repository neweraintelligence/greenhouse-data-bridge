import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FolderInput, AlertCircle, Check, Play } from 'lucide-react';

export interface IntakeItem {
  id: string;
  name: string;
  received: boolean;
  required: boolean;
}

export interface IntakeNodeData {
  label: string;
  items: IntakeItem[];
  onProcess?: () => void;
  canProcess: boolean;
}

interface IntakeNodeProps {
  data: IntakeNodeData;
}

function IntakeNodeComponent({ data }: IntakeNodeProps) {
  const requiredItems = data.items.filter((i) => i.required);
  const allRequiredReceived = requiredItems.every((i) => i.received);
  const receivedCount = data.items.filter((i) => i.received).length;
  const isReady = data.canProcess && allRequiredReceived;

  return (
    <div className={`glass-node min-w-[200px] overflow-hidden ${isReady ? 'glass-node-active' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-white !border-2 !border-gray-400 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-white !border-2 !border-bmf-blue !w-3 !h-3" />

      {/* Header */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700">
        <div className="flex items-center gap-2">
          <FolderInput className="w-4 h-4 text-white" />
          <span className="text-sm font-medium text-white">{data.label}</span>
        </div>
      </div>

      {/* Items list */}
      <div className="p-3 space-y-1.5 bg-white/80">
        {data.items.map((item) => (
          <div
            key={item.id}
            className={`
              flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm
              ${item.received ? 'bg-emerald-50' : item.required ? 'bg-red-50/50' : 'bg-gray-50'}
            `}
          >
            {item.received ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : item.required ? (
              <AlertCircle className="w-4 h-4 text-red-400" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
            )}
            <span className={item.received ? 'text-gray-700' : 'text-gray-400'}>
              {item.name}
            </span>
            {!item.required && !item.received && (
              <span className="text-[10px] text-gray-400 ml-auto">optional</span>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5 bg-gray-50/80 border-t border-gray-200/50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {receivedCount}/{data.items.length} received
          </span>
          <button
            onClick={data.onProcess}
            disabled={!isReady}
            className={`
              flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all
              ${isReady
                ? 'bg-gradient-to-r from-bmf-blue to-bmf-blue-dark text-white shadow-[0_2px_10px_rgba(37,150,190,0.3)] hover:shadow-[0_4px_16px_rgba(37,150,190,0.4)] hover:-translate-y-0.5'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <Play className="w-3 h-3" />
            Process
          </button>
        </div>
      </div>
    </div>
  );
}

export const IntakeNode = memo(IntakeNodeComponent);
