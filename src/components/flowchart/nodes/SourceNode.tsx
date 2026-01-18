import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Mail, FolderOpen, FileSpreadsheet, FileText, Camera, Check, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { OutlookMiniApp, type EmailItem } from './mini-apps/OutlookMiniApp';
import { OneDriveMiniApp, type FileItem } from './mini-apps/OneDriveMiniApp';
import { ExcelMiniApp, type SpreadsheetData } from './mini-apps/ExcelMiniApp';
import { PaperScanMiniApp, type ExtractedField } from './mini-apps/PaperScanMiniApp';

export interface SourceNodeData {
  label: string;
  type: 'outlook' | 'onedrive' | 'excel' | 'paper';
  status: 'pending' | 'loading' | 'complete';
  optional?: boolean;
  onActivate?: () => void;
  // Mini-app data
  emails?: EmailItem[];
  files?: FileItem[];
  spreadsheet?: SpreadsheetData;
  capturedImage?: string;
  extractedFields?: ExtractedField[];
  onEmailSelect?: (email: EmailItem) => void;
  onFileSelect?: (file: FileItem) => void;
  onImageCapture?: (file: File) => void;
  onImageClear?: () => void;
  onConfirm?: () => void;
}

const iconMap = {
  outlook: Mail,
  onedrive: FolderOpen,
  excel: FileSpreadsheet,
  paper: Camera,
};

const headerColors = {
  outlook: {
    bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
    glow: 'shadow-[0_4px_20px_rgba(59,130,246,0.3)]',
  },
  onedrive: {
    bg: 'bg-gradient-to-r from-sky-500 to-blue-500',
    glow: 'shadow-[0_4px_20px_rgba(14,165,233,0.3)]',
  },
  excel: {
    bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
    glow: 'shadow-[0_4px_20px_rgba(34,197,94,0.3)]',
  },
  paper: {
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    glow: 'shadow-[0_4px_20px_rgba(245,158,11,0.3)]',
  },
};

interface SourceNodeProps {
  data: SourceNodeData;
}

function SourceNodeComponent({ data }: SourceNodeProps) {
  const [isExpanded, setIsExpanded] = useState(data.status !== 'pending');
  const Icon = iconMap[data.type] || FileText;
  const colors = headerColors[data.type] || headerColors.paper;

  const handleHeaderClick = () => {
    if (data.status === 'pending') {
      data.onActivate?.();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div
      className={`
        glass-node min-w-[220px] max-w-[280px] overflow-hidden
        ${data.status === 'complete' ? 'glass-node-active' : ''}
      `}
    >
      <Handle type="source" position={Position.Right} className="!bg-white !border-2 !border-bmf-blue !w-3 !h-3" />

      {/* Header */}
      <div
        className={`
          px-4 py-2.5 ${colors.bg} cursor-pointer
          flex items-center justify-between
          ${data.status === 'complete' ? colors.glow : ''}
        `}
        onClick={handleHeaderClick}
      >
        <div className="flex items-center gap-2">
          {data.status === 'loading' ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : data.status === 'complete' ? (
            <Check className="w-4 h-4 text-white" />
          ) : (
            <Icon className="w-4 h-4 text-white" />
          )}
          <span className="text-sm font-medium text-white">{data.label}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {data.optional && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white">
              Optional
            </span>
          )}
          {data.status !== 'pending' && (
            isExpanded ? (
              <ChevronUp className="w-4 h-4 text-white/70" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/70" />
            )
          )}
        </div>
      </div>

      {/* Mini-app content */}
      {isExpanded && data.status !== 'pending' && (
        <div className="p-3 bg-white/80">
          {data.type === 'outlook' && (
            <OutlookMiniApp
              emails={data.emails || []}
              onSelect={data.onEmailSelect}
              isLoading={data.status === 'loading'}
            />
          )}

          {data.type === 'onedrive' && (
            <OneDriveMiniApp
              files={data.files || []}
              onSelect={data.onFileSelect}
              isLoading={data.status === 'loading'}
            />
          )}

          {data.type === 'excel' && data.spreadsheet && (
            <ExcelMiniApp
              data={data.spreadsheet}
              isLoading={data.status === 'loading'}
            />
          )}

          {data.type === 'paper' && (
            <PaperScanMiniApp
              capturedImage={data.capturedImage}
              extractedFields={data.extractedFields}
              isAnalyzing={data.status === 'loading'}
              onCapture={data.onImageCapture}
              onClear={data.onImageClear}
              onConfirm={data.onConfirm}
            />
          )}
        </div>
      )}

      {/* Collapsed state hint */}
      {data.status === 'pending' && (
        <div className="px-4 py-2 bg-white/60 text-center">
          <span className="text-xs text-gray-500">Click to activate</span>
        </div>
      )}
    </div>
  );
}

export const SourceNode = memo(SourceNodeComponent);
