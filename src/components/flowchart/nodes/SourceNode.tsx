import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Mail, FolderOpen, FileSpreadsheet, FileText, Camera, Check, Loader2, ChevronDown, ChevronUp, Maximize2, Clock, Zap, QrCode, ScanBarcode, Presentation, UserPlus } from 'lucide-react';
import { OutlookMiniApp, type EmailItem } from './mini-apps/OutlookMiniApp';
import { OneDriveMiniApp, type FileItem } from './mini-apps/OneDriveMiniApp';
import { ExcelMiniApp, type SpreadsheetData } from './mini-apps/ExcelMiniApp';
import { PaperScanMiniApp, type ExtractedField } from './mini-apps/PaperScanMiniApp';
import { QRCodeSVG } from 'qrcode.react';

export type DisplayMode = 'collapsed' | 'preview' | 'maximized';

export interface SourceNodeData {
  label: string;
  type: 'outlook' | 'onedrive' | 'excel' | 'paper' | 'barcode';
  status: 'pending' | 'loading' | 'complete';
  optional?: boolean;
  // Scheduling - 'auto' means system generates data on schedule, 'manual' means user uploads
  scheduling?: 'auto' | 'manual';
  onActivate?: () => void;
  onExpand?: () => void;
  onShowInfo?: () => void;
  isFocused?: boolean;
  // Session code for QR code generation
  sessionCode?: string;
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
  // QR code URL for paper sources
  qrCodeUrl?: string;
  // Session code for generating scanner URLs
  sessionCode?: string;
}

const iconMap = {
  outlook: Mail,
  onedrive: FolderOpen,
  excel: FileSpreadsheet,
  paper: Camera,
  barcode: ScanBarcode,
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
  barcode: {
    bg: 'bg-gradient-to-r from-violet-500 to-purple-600',
    glow: 'shadow-[0_4px_20px_rgba(139,92,246,0.3)]',
  },
};

interface SourceNodeProps {
  data: SourceNodeData;
}

function SourceNodeComponent({ data }: SourceNodeProps) {
  // Display mode: collapsed (just header), preview (inline content), maximized (modal - handled by parent)
  // Always start collapsed - user clicks to expand
  const [displayMode, setDisplayMode] = useState<DisplayMode>('collapsed');
  const [showJoinQR, setShowJoinQR] = useState(false);

  const Icon = iconMap[data.type] || FileText;
  const colors = headerColors[data.type] || headerColors.paper;
  const isScheduled = data.scheduling === 'auto' || (data.type !== 'paper'); // Default: non-paper sources are auto

  // Handle header click - toggle between collapsed and preview
  const handleHeaderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDisplayMode(prev => prev === 'collapsed' ? 'preview' : 'collapsed');
  };

  // Explicit activation via play button
  const handleActivate = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onActivate?.();
  };

  // Explicit expand to full modal view
  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onExpand?.();
  };

  // Show info overlay
  const handleShowInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onShowInfo?.();
  };

  // Collapsed mode - compact header with essential controls
  if (displayMode === 'collapsed') {
    return (
      <div className={`min-w-[200px] relative mt-3 rounded-2xl bg-white border border-gray-200/50 shadow-sm ${data.status === 'complete' ? 'shadow-[0_4px_16px_rgba(37,150,190,0.25)]' : ''}`}>
        <Handle type="target" position={Position.Left} className="!bg-white !border-2 !border-gray-400 !w-3 !h-3" />
        <Handle type="source" position={Position.Right} className="!bg-white !border-2 !border-bmf-blue !w-3 !h-3" />

        {/* Scheduling badge - positioned top-left outside */}
        {isScheduled && data.status === 'pending' && (
          <div className="absolute -top-3 left-3 z-10">
            <div className="flex items-center gap-1 px-2 py-1 bg-slate-700 text-white text-[10px] font-medium rounded-full shadow-md">
              <Clock className="w-3 h-3" />
              <span>Auto</span>
            </div>
          </div>
        )}
        {!isScheduled && data.status === 'pending' && (
          <div className="absolute -top-3 left-3 z-10">
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-600 text-white text-[10px] font-medium rounded-full shadow-md">
              <Zap className="w-3 h-3" />
              <span>Manual</span>
            </div>
          </div>
        )}

        <div
          className={`px-4 py-2.5 ${colors.bg} cursor-pointer flex items-center justify-between rounded-2xl ${data.status === 'complete' ? colors.glow : ''}`}
          onClick={handleHeaderClick}
        >
          <div className="flex items-center gap-2.5">
            {data.status === 'loading' ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : data.status === 'complete' ? (
              <Check className="w-4 h-4 text-white" />
            ) : (
              <Icon className="w-4 h-4 text-white" />
            )}
            <span className="text-sm font-medium text-white">{data.label}</span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {/* Info button - circular */}
            {data.onShowInfo && (
              <button
                onClick={handleShowInfo}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
                title="Present this node"
              >
                <Presentation className="w-3.5 h-3.5 text-white" />
              </button>
            )}
            {/* Join/Participate button - QR code on hover */}
            {data.sessionCode && (
              <div className="relative">
                <button
                  onMouseEnter={() => setShowJoinQR(true)}
                  onMouseLeave={() => setShowJoinQR(false)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center relative"
                  title="Scan to participate"
                >
                  <QrCode className="w-3.5 h-3.5 text-white" />
                  <UserPlus className="w-2 h-2 text-white absolute -top-0.5 -right-0.5" />
                </button>
                {/* QR Code Tooltip */}
                {showJoinQR && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-3 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-in fade-in duration-200">
                    <QRCodeSVG
                      value={`${window.location.origin}/upload/${data.sessionCode}/${encodeURIComponent(data.label)}`}
                      size={140}
                      level="M"
                      includeMargin
                      className="rounded"
                    />
                    <p className="text-[10px] text-gray-600 text-center mt-2">Scan to join</p>
                  </div>
                )}
              </div>
            )}
            {/* Fetch/Download button for digital sources - circular */}
            {data.status === 'pending' && data.type !== 'paper' && (
              <button
                onClick={handleActivate}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
                title="Fetch data"
              >
                <Zap className="w-3.5 h-3.5 text-white" />
              </button>
            )}
            <ChevronDown className="w-4 h-4 text-white/60" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        min-w-[220px] max-w-[280px] relative mt-3 rounded-2xl
        bg-white border border-gray-200/50 shadow-sm
        ${data.status === 'complete' ? 'shadow-[0_4px_16px_rgba(37,150,190,0.25)]' : ''}
      `}
    >
      <Handle type="target" position={Position.Left} className="!bg-white !border-2 !border-gray-400 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-white !border-2 !border-bmf-blue !w-3 !h-3" />

      {/* Scheduling badge - positioned top-left outside */}
      {isScheduled && data.status === 'pending' && (
        <div className="absolute -top-3 left-3 z-10">
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-700 text-white text-[10px] font-medium rounded-full shadow-md">
            <Clock className="w-3 h-3" />
            <span>Auto</span>
          </div>
        </div>
      )}

      {!isScheduled && data.status === 'pending' && (
        <div className="absolute -top-3 left-3 z-10">
          <div className="flex items-center gap-1 px-2 py-1 bg-amber-600 text-white text-[10px] font-medium rounded-full shadow-md">
            <Zap className="w-3 h-3" />
            <span>Manual</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className={`
          px-4 py-2.5 ${colors.bg} cursor-pointer rounded-t-2xl
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

        <div className="flex items-center gap-2 ml-4">
          {data.optional && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white">
              Optional
            </span>
          )}
          {/* Presentation button - circular */}
          {data.onShowInfo && (
            <button
              onClick={handleShowInfo}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
              title="Present this node"
            >
              <Presentation className="w-3.5 h-3.5 text-white" />
            </button>
          )}
          {/* Fetch button for digital sources - circular */}
          {data.status === 'pending' && data.type !== 'paper' && (
            <button
              onClick={handleActivate}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
              title="Fetch data"
            >
              <Zap className="w-3.5 h-3.5 text-white" />
            </button>
          )}
          {/* QR indicator for paper - circular */}
          {data.status === 'pending' && data.type === 'paper' && (
            <div
              className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"
              title="Scan via QR code"
            >
              <QrCode className="w-3.5 h-3.5 text-white" />
            </div>
          )}
          {/* Maximize button when data is loaded - circular */}
          {data.status === 'complete' && data.onExpand && (
            <button
              onClick={handleMaximize}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
              title="Expand to full view"
            >
              <Maximize2 className="w-3.5 h-3.5 text-white" />
            </button>
          )}
          {/* Collapse/expand toggle */}
          {data.status !== 'pending' && (
            displayMode === 'preview' ? (
              <ChevronUp className="w-4 h-4 text-white/60" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/60" />
            )
          )}
        </div>
      </div>

      {/* Mini-app content - preview mode */}
      {/* For digital sources: only show after data arrives */}
      {/* For paper sources: always show upload/QR options */}
      {displayMode === 'preview' && (data.status !== 'pending' || data.type === 'paper') && (
        <div className="p-3 bg-white rounded-b-2xl">
          <div className="node-content-inset p-3 rounded-xl">
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
                qrCodeUrl={data.qrCodeUrl}
              />
            )}

            {data.type === 'barcode' && (
              <div className="space-y-3">
                {/* Scanner QR Code - always visible for demo */}
                <div className="text-center p-3 bg-violet-50 rounded-xl border border-violet-200">
                  <p className="text-xs font-medium text-gray-700 mb-2">Scan to Open Mobile Scanner</p>
                  {data.sessionCode && (
                    <div className="bg-white p-2 rounded-lg inline-block">
                      <QRCodeSVG
                        value={`${window.location.origin}/scan/${data.sessionCode}`}
                        size={100}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-gray-500 mt-2">Point phone camera at QR code</p>
                </div>

                {data.status === 'loading' ? (
                  <div className="space-y-1.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded bg-gray-50">
                        <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-2">
                      <ScanBarcode className="w-3 h-3" />
                      <span>Recent scans</span>
                    </div>
                    <div className="space-y-1 max-h-[120px] overflow-y-auto">
                      {/* Demo barcode entries with SKUs */}
                      {[
                        { code: 'OUT-0001', time: '10:15 AM', sku: 'PET-WAVE-606-PUR', qty: 42 },
                        { code: 'OUT-0002', time: '09:42 AM', sku: 'GER-ZON-45-RED', qty: 24 },
                        { code: 'OUT-0003', time: '14:20 AM', sku: 'PET-STVB-606-PUR', qty: 72 },
                      ].map((entry, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded bg-gray-50 text-xs">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <code className="font-mono text-violet-600 font-semibold text-[11px]">{entry.code}</code>
                            </div>
                            <code className="font-mono text-gray-500 text-[10px]">{entry.sku}</code>
                          </div>
                          <span className="text-gray-400 text-[10px]">{entry.qty} units</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-center pt-1">
                      <span className="text-[10px] text-gray-400">Scans from seed data</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending state footer - only for non-paper sources */}
      {data.status === 'pending' && data.type !== 'paper' && (
        <div className="px-4 py-3 bg-white rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500">
                Awaiting export
              </span>
            </div>
            <span className="text-[10px] text-gray-400">
              {isScheduled ? 'Auto-fetch' : 'Manual'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export const SourceNode = memo(SourceNodeComponent);
