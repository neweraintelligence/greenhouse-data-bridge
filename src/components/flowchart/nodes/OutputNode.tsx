import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileDown, FileText, Table, Download, Eye } from 'lucide-react';

export interface OutputFile {
  id: string;
  name: string;
  type: 'pdf' | 'csv';
  ready: boolean;
  url?: string;
}

export interface OutputNodeData {
  label: string;
  files: OutputFile[];
  onPreview?: (file: OutputFile) => void;
  onDownload?: (file: OutputFile) => void;
}

interface OutputNodeProps {
  data: OutputNodeData;
}

function OutputNodeComponent({ data }: OutputNodeProps) {
  const readyCount = data.files.filter((f) => f.ready).length;

  return (
    <div className="bg-white rounded-lg border-2 border-emerald-200 min-w-[180px] shadow-sm">
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />

      {/* Header */}
      <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 rounded-t-lg">
        <div className="flex items-center gap-2">
          <FileDown className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-gray-700">{data.label}</span>
        </div>
      </div>

      {/* Files list */}
      <div className="p-3 space-y-2">
        {data.files.map((file) => (
          <div
            key={file.id}
            className={`flex items-center justify-between p-2 rounded-md ${
              file.ready ? 'bg-gray-50' : 'bg-gray-100 opacity-50'
            }`}
          >
            <div className="flex items-center gap-2">
              {file.type === 'pdf' ? (
                <FileText className="w-4 h-4 text-red-500" />
              ) : (
                <Table className="w-4 h-4 text-green-600" />
              )}
              <span className="text-xs text-gray-700 truncate max-w-[100px]">
                {file.name}
              </span>
            </div>

            {file.ready && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => data.onPreview?.(file)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Preview"
                >
                  <Eye className="w-3 h-3 text-gray-500" />
                </button>
                <button
                  onClick={() => data.onDownload?.(file)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Download"
                >
                  <Download className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            )}
          </div>
        ))}

        {data.files.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-2">
            No outputs yet
          </p>
        )}
      </div>

      {/* Footer */}
      {data.files.length > 0 && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <span className="text-xs text-gray-500">
            {readyCount}/{data.files.length} ready
          </span>
        </div>
      )}
    </div>
  );
}

export const OutputNode = memo(OutputNodeComponent);
