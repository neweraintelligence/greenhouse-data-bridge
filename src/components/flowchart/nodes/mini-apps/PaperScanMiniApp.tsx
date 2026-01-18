import { memo, useState, useRef } from 'react';
import { Camera, Upload, X, Check, AlertCircle, Sparkles } from 'lucide-react';
import { ConfidenceBadge } from '../../../design-system';

export interface ExtractedField {
  label: string;
  value: string;
  confidence: number;
}

interface PaperScanMiniAppProps {
  capturedImage?: string;
  extractedFields?: ExtractedField[];
  isAnalyzing?: boolean;
  onCapture?: (file: File) => void;
  onClear?: () => void;
  onConfirm?: () => void;
}

function PaperScanMiniAppComponent({
  capturedImage,
  extractedFields,
  isAnalyzing,
  onCapture,
  onClear,
  onConfirm,
}: PaperScanMiniAppProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onCapture?.(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture?.(file);
    }
  };

  // Show captured image with analysis results
  if (capturedImage) {
    return (
      <div className="space-y-2">
        {/* Image preview */}
        <div className="relative rounded-lg overflow-hidden bg-gray-900">
          <img
            src={capturedImage}
            alt="Captured document"
            className="w-full h-24 object-cover"
          />

          {/* Analysis overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex items-center gap-2 text-white text-xs">
                <Sparkles className="w-4 h-4 text-ai-purple animate-pulse" />
                <span>Analyzing with Gemini...</span>
              </div>
            </div>
          )}

          {/* Clear button */}
          <button
            onClick={onClear}
            className="absolute top-1.5 right-1.5 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>

        {/* Extracted fields */}
        {extractedFields && extractedFields.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <Sparkles className="w-3 h-3 text-ai-purple" />
              <span>AI-extracted fields</span>
            </div>

            {extractedFields.map((field, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 p-1.5 rounded bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-gray-500 block">{field.label}</span>
                  <span className="text-xs font-medium text-gray-800 truncate block">
                    {field.value || '—'}
                  </span>
                </div>
                <ConfidenceBadge score={field.confidence} />
              </div>
            ))}

            {/* Confirm button */}
            <button
              onClick={onConfirm}
              className="w-full mt-2 py-1.5 px-3 bg-bmf-blue text-white text-xs font-medium rounded-lg hover:bg-bmf-blue-dark transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="w-3 h-3" />
              Confirm & Import
            </button>
          </div>
        )}

        {/* Low confidence warning */}
        {extractedFields?.some((f) => f.confidence < 50) && (
          <div className="flex items-start gap-1.5 p-2 rounded bg-amber-50 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700">
              Some fields have low confidence. Please review before confirming.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Show upload/capture interface
  return (
    <div
      className={`
        scanner-viewfinder relative
        border-2 border-dashed rounded-xl p-4
        transition-colors cursor-pointer
        ${isDragging ? 'border-bmf-blue bg-bmf-blue/5' : 'border-gray-300 hover:border-bmf-blue/50'}
      `}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-bmf-blue/10">
            <Camera className="w-4 h-4 text-bmf-blue" />
          </div>
          <div className="text-gray-300">|</div>
          <div className="p-2 rounded-full bg-bmf-blue/10">
            <Upload className="w-4 h-4 text-bmf-blue" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs font-medium text-gray-700">
            {isDragging ? 'Drop image here' : 'Capture or upload'}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            Photo of physical document
          </p>
        </div>
      </div>

      {/* Scanner corner decorations */}
      <div className="scanner-corners" />
      <div className="scanner-corners-bottom" />
    </div>
  );
}

export const PaperScanMiniApp = memo(PaperScanMiniAppComponent);
