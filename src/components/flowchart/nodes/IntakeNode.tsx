import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FolderInput, AlertCircle, Check } from 'lucide-react';

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

  return (
    <div className="bg-white rounded-lg border-2 border-gray-300 min-w-[180px] shadow-sm">
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <Handle type="source" position={Position.Right} className="!bg-gray-400" />

      {/* Header */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center gap-2">
          <FolderInput className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">{data.label}</span>
        </div>
      </div>

      {/* Items list */}
      <div className="p-3 space-y-2">
        {data.items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-sm">
            {item.received ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : item.required ? (
              <AlertCircle className="w-4 h-4 text-red-400" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-gray-300" />
            )}
            <span className={item.received ? 'text-gray-700' : 'text-gray-400'}>
              {item.name}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {receivedCount}/{data.items.length} received
          </span>
          <button
            onClick={data.onProcess}
            disabled={!data.canProcess || !allRequiredReceived}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
              data.canProcess && allRequiredReceived
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Process
          </button>
        </div>
      </div>
    </div>
  );
}

export const IntakeNode = memo(IntakeNodeComponent);
