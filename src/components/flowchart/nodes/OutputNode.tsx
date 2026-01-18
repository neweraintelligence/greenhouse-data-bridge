import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileDown, FileText, Table, Download, Eye, CheckCircle2 } from 'lucide-react';

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
  const allReady = readyCount === data.files.length && data.files.length > 0;

  return (
    <div className={`glass-node min-w-[200px] overflow-hidden ${allReady ? 'glass-node-active' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-white !border-2 !border-gray-400 !w-3 !h-3" />

      {/* Header */}
      <div
        className={`
          px-4 py-2.5
          ${allReady
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-[0_4px_20px_rgba(16,185,129,0.3)]'
            : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
          }
        `}
      >
        <div className="flex items-center gap-2">
          {allReady ? (
            <CheckCircle2 className="w-4 h-4 text-white" />
          ) : (
            <FileDown className="w-4 h-4 text-white" />
          )}
          <span className="text-sm font-medium text-white">{data.label}</span>
        </div>
      </div>

      {/* Files list */}
      <div className="p-3 space-y-2 bg-white/80">
        {data.files.map((file) => (
          <div
            key={file.id}
            className={`
              flex items-center justify-between p-2.5 rounded-lg transition-all
              ${file.ready
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-gray-100 opacity-60'
              }
            `}
          >
            <div className="flex items-center gap-2">
              {file.type === 'pdf' ? (
                <div className="p-1.5 rounded bg-red-100">
                  <FileText className="w-4 h-4 text-red-500" />
                </div>
              ) : (
                <div className="p-1.5 rounded bg-green-100">
                  <Table className="w-4 h-4 text-green-600" />
                </div>
              )}
              <div>
                <span className="text-xs font-medium text-gray-700 block">
                  {file.name}
                </span>
                <span className="text-[10px] text-gray-400 uppercase">
                  {file.type}
                </span>
              </div>
            </div>

            {file.ready && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => data.onPreview?.(file)}
                  className="p-1.5 hover:bg-white rounded-lg transition-colors group"
                  title="Preview"
                >
                  <Eye className="w-4 h-4 text-gray-400 group-hover:text-bmf-blue" />
                </button>
                <button
                  onClick={() => data.onDownload?.(file)}
                  className="p-1.5 hover:bg-white rounded-lg transition-colors group"
                  title="Download"
                >
                  <Download className="w-4 h-4 text-gray-400 group-hover:text-bmf-blue" />
                </button>
              </div>
            )}
          </div>
        ))}

        {data.files.length === 0 && (
          <div className="text-center py-4">
            <FileDown className="w-8 h-8 text-gray-300 mx-auto mb-1" />
            <p className="text-xs text-gray-400">No outputs yet</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {data.files.length > 0 && (
        <div className="px-3 py-2 bg-gray-50/80 border-t border-gray-200/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {readyCount}/{data.files.length} ready
            </span>
            {allReady && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Complete
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const OutputNode = memo(OutputNodeComponent);
