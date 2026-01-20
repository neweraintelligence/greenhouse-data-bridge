import { X, Maximize2, ZoomIn, ZoomOut, Plus, QrCode } from 'lucide-react';
import { useState } from 'react';
import { OutlookMiniApp, type EmailItem } from './nodes/mini-apps/OutlookMiniApp';
import { OneDriveMiniApp, type FileItem } from './nodes/mini-apps/OneDriveMiniApp';
import type { SpreadsheetData } from './nodes/mini-apps/ExcelMiniApp';
import { PaperScanMiniApp, type ExtractedField } from './nodes/mini-apps/PaperScanMiniApp';
import { GlassButton } from '../design-system';

interface ExpandedNodeModalProps {
  nodeType: 'outlook' | 'onedrive' | 'excel' | 'paper';
  label: string;
  onClose: () => void;
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
  // For editable spreadsheet
  onSpreadsheetUpdate?: (data: SpreadsheetData) => void;
  onAddRow?: () => void;
  // QR code URL for mobile participation
  qrCodeUrl?: string;
}

export function ExpandedNodeModal({
  nodeType,
  label,
  onClose,
  emails,
  files,
  spreadsheet,
  capturedImage,
  extractedFields,
  onEmailSelect,
  onFileSelect,
  onImageCapture,
  onImageClear,
  onConfirm,
  onSpreadsheetUpdate,
  onAddRow,
  qrCodeUrl,
}: ExpandedNodeModalProps) {
  const [zoom, setZoom] = useState(1);
  const [editableSpreadsheet, setEditableSpreadsheet] = useState<SpreadsheetData | undefined>(spreadsheet);
  const [showQrCode, setShowQrCode] = useState(false);

  const handleCellEdit = (rowIndex: number, colIndex: number, value: string | number) => {
    if (!editableSpreadsheet) return;

    const newRows = [...editableSpreadsheet.rows];
    newRows[rowIndex] = [...newRows[rowIndex]];
    newRows[rowIndex][colIndex] = value;

    const updated = { ...editableSpreadsheet, rows: newRows };
    setEditableSpreadsheet(updated);
    onSpreadsheetUpdate?.(updated);
  };

  return (
    <div
      className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <Maximize2 className="w-5 h-5 text-bmf-blue" />
            <h2 className="text-lg font-semibold text-gray-800">{label}</h2>
          </div>
          <div className="flex items-center gap-2">
            {(nodeType === 'paper' || nodeType === 'onedrive') && (
              <>
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                  icon={<ZoomOut className="w-4 h-4" />}
                >{''}</GlassButton>
                <span className="text-sm text-gray-500 min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                  icon={<ZoomIn className="w-4 h-4" />}
                >{''}</GlassButton>
              </>
            )}
            {qrCodeUrl && (
              <GlassButton
                variant={showQrCode ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setShowQrCode(!showQrCode)}
                icon={<QrCode className="w-4 h-4" />}
              >
                {showQrCode ? 'Hide' : 'Mobile'}
              </GlassButton>
            )}
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              icon={<X className="w-4 h-4" />}
            >{''}</GlassButton>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
          {nodeType === 'outlook' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">Click on an email to view details and select it for processing.</p>
              <OutlookMiniApp
                emails={emails || []}
                onSelect={onEmailSelect}
                isLoading={false}
                expanded
              />
            </div>
          )}

          {nodeType === 'onedrive' && (
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
              <p className="text-sm text-gray-500 mb-4">Browse files and folders. Click to select files for processing.</p>
              <OneDriveMiniApp
                files={files || []}
                onSelect={onFileSelect}
                isLoading={false}
                expanded
              />
            </div>
          )}

          {nodeType === 'excel' && editableSpreadsheet && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Click on any cell to edit its value. Changes are preserved for processing.</p>
              <EditableSpreadsheet
                data={editableSpreadsheet}
                onCellEdit={handleCellEdit}
                onAddRow={onAddRow}
              />
            </div>
          )}

          {nodeType === 'paper' && (
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
              <PaperScanMiniApp
                capturedImage={capturedImage}
                extractedFields={extractedFields}
                isAnalyzing={false}
                onCapture={onImageCapture}
                onClear={onImageClear}
                onConfirm={onConfirm}
                expanded
                qrCodeUrl={qrCodeUrl}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Editable spreadsheet component for expanded view
interface EditableSpreadsheetProps {
  data: SpreadsheetData;
  onCellEdit: (rowIndex: number, colIndex: number, value: string | number) => void;
  onAddRow?: () => void;
}

function EditableSpreadsheet({ data, onCellEdit, onAddRow }: EditableSpreadsheetProps) {
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (rowIndex: number, colIndex: number, currentValue: string | number) => {
    setEditingCell({ row: rowIndex, col: colIndex });
    setEditValue(String(currentValue));
  };

  const commitEdit = () => {
    if (editingCell) {
      const numValue = Number(editValue);
      onCellEdit(editingCell.row, editingCell.col, isNaN(numValue) ? editValue : numValue);
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-green-600 text-white px-4 py-2 text-sm font-medium">
        {data.sheetName}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="spreadsheet-cell spreadsheet-header w-10 text-center text-gray-400">#</th>
              {data.headers.map((header, i) => (
                <th key={i} className="spreadsheet-cell spreadsheet-header text-left font-medium text-gray-700">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-blue-50/50">
                <td className="spreadsheet-cell text-center text-gray-400 bg-gray-50">
                  {rowIndex + 1}
                </td>
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className="spreadsheet-cell cursor-pointer hover:bg-blue-100/50"
                    onClick={() => startEdit(rowIndex, colIndex, cell)}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleKeyDown}
                        className="w-full px-1 py-0.5 border border-bmf-blue rounded text-xs focus:outline-none focus:ring-1 focus:ring-bmf-blue"
                        autoFocus
                      />
                    ) : (
                      <span className="text-xs">{cell}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Click any cell to edit. Press Enter to save or Escape to cancel.
        </span>
        {onAddRow && (
          <GlassButton
            variant="primary"
            size="sm"
            onClick={onAddRow}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Row
          </GlassButton>
        )}
      </div>
    </div>
  );
}
