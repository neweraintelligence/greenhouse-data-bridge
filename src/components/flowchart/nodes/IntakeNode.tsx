import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Cloud,
  Folder,
  FileText,
  FileSpreadsheet,
  ChevronRight,
  Check,
  Clock,
  AlertCircle,
  Play,
  Presentation,
} from 'lucide-react';

export interface IntakeItem {
  id: string;
  name: string;
  received: boolean;
  required: boolean;
  type?: 'outlook' | 'onedrive' | 'excel' | 'paper';
}

export interface IntakeNodeData {
  label: string;
  items: IntakeItem[];
  onProcess?: () => void;
  canProcess: boolean;
  onShowInfo?: () => void;
}

interface IntakeNodeProps {
  data: IntakeNodeData;
}

// Map source types to file icons
const getFileIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('email') || lowerName.includes('outlook')) return FileText;
  if (lowerName.includes('excel') || lowerName.includes('spreadsheet')) return FileSpreadsheet;
  return FileText;
};

function IntakeNodeComponent({ data }: IntakeNodeProps) {
  const requiredItems = data.items.filter((i) => i.required);
  const allRequiredReceived = requiredItems.every((i) => i.received);
  const receivedCount = data.items.filter((i) => i.received).length;
  const isReady = data.canProcess && allRequiredReceived;

  return (
    <div className={`glass-node min-w-[220px] max-w-[280px] overflow-hidden ${isReady ? 'glass-node-active' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-white !border-2 !border-gray-400 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-white !border-2 !border-bmf-blue !w-3 !h-3" />

      {/* OneDrive-style header */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-white" />
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

      {/* Breadcrumb path */}
      <div className="px-3 py-1.5 bg-white/90 border-b border-gray-100">
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <Folder className="w-3 h-3 text-amber-500" />
          <span>Intake</span>
          <ChevronRight className="w-2.5 h-2.5" />
          <span className="font-medium text-gray-700">Pending Files</span>
        </div>
      </div>

      {/* File list - OneDrive style */}
      <div className="p-2 bg-white/80 space-y-0.5 max-h-[200px] overflow-y-auto">
        {data.items.map((item) => {
          const Icon = getFileIcon(item.name);

          return (
            <div
              key={item.id}
              className={`
                flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors
                ${item.received ? 'bg-emerald-50/80' : 'bg-gray-50/80'}
              `}
            >
              {/* File icon */}
              <Icon className={`w-4 h-4 shrink-0 ${item.received ? 'text-emerald-600' : 'text-gray-400'}`} />

              {/* File name */}
              <span className={`text-xs truncate flex-1 ${item.received ? 'text-gray-700' : 'text-gray-400'}`}>
                {item.name}
              </span>

              {/* Status indicator */}
              {item.received ? (
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : item.required ? (
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              )}

              {/* Required/Optional badge */}
              {!item.received && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${
                  item.required ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {item.required ? 'Required' : 'Optional'}
                </span>
              )}
            </div>
          );
        })}

        {data.items.length === 0 && (
          <div className="text-center py-4">
            <Folder className="w-6 h-6 text-gray-300 mx-auto mb-1" />
            <p className="text-xs text-gray-400">No items configured</p>
          </div>
        )}
      </div>

      {/* Footer with status and process button */}
      <div className="px-3 py-2.5 bg-gray-50/90 border-t border-gray-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-emerald-500' : 'bg-gray-300'}`} />
            <span className="text-[10px] text-gray-500">
              {receivedCount}/{data.items.length} received
            </span>
          </div>
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
