import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Mail, FolderOpen, FileSpreadsheet, FileText, Barcode, Check, Loader2 } from 'lucide-react';

export interface SourceNodeData {
  label: string;
  type: 'outlook' | 'onedrive' | 'excel' | 'paper' | 'barcode';
  status: 'pending' | 'loading' | 'complete';
  optional?: boolean;
  onActivate?: () => void;
}

const iconMap = {
  outlook: Mail,
  onedrive: FolderOpen,
  excel: FileSpreadsheet,
  paper: FileText,
  barcode: Barcode,
};

const colorMap = {
  outlook: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500' },
  onedrive: { bg: 'bg-sky-50', border: 'border-sky-200', icon: 'text-sky-500' },
  excel: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600' },
  paper: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600' },
  barcode: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-500' },
};

interface SourceNodeProps {
  data: SourceNodeData;
}

function SourceNodeComponent({ data }: SourceNodeProps) {
  const Icon = iconMap[data.type] || FileText;
  const colors = colorMap[data.type] || colorMap.paper;

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 ${colors.bg} ${colors.border} min-w-[140px] cursor-pointer hover:shadow-md transition-all`}
      onClick={data.onActivate}
    >
      <Handle type="source" position={Position.Right} className="!bg-gray-400" />

      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${colors.icon}`} />
        <span className="text-sm font-medium text-gray-700">{data.label}</span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {data.optional ? 'Optional' : 'Required'}
        </span>

        {data.status === 'pending' && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
            Click to fetch
          </span>
        )}
        {data.status === 'loading' && (
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
        )}
        {data.status === 'complete' && (
          <Check className="w-4 h-4 text-green-500" />
        )}
      </div>
    </div>
  );
}

export const SourceNode = memo(SourceNodeComponent);
