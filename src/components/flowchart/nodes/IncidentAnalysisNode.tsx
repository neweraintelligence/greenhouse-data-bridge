import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Brain, Sparkles, Presentation } from 'lucide-react';

export interface IncidentAnalysisNodeData {
  label: string;
  isProcessing: boolean;
  totalAnalyzed: number;
  avgConfidence: number;
  onShowInfo?: () => void;
}

interface IncidentAnalysisNodeProps {
  data: IncidentAnalysisNodeData;
}

function IncidentAnalysisNodeComponent({ data }: IncidentAnalysisNodeProps) {
  return (
    <div className="glass-node min-w-[280px] max-w-[320px] overflow-hidden">
      <Handle type="target" position={Position.Left} className="!bg-white !border-2 !border-gray-400 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-purple-500 !border-2 !border-purple-600 !w-3 !h-3" />

      {/* Header */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-white" />
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

      {/* Content */}
      <div className="p-4 bg-white/90">
        {data.isProcessing ? (
          <div className="space-y-3">
            {/* Processing animation */}
            <div className="flex items-center justify-center py-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                <Sparkles className="w-6 h-6 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Processing steps */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-gray-700">Analyzing image with Gemini Vision...</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <span className="text-gray-700">Detecting incident type...</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-purple-300 animate-pulse" style={{ animationDelay: '0.4s' }} />
                <span className="text-gray-700">Calculating severity score...</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-purple-200 animate-pulse" style={{ animationDelay: '0.6s' }} />
                <span className="text-gray-700">Determining routing...</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Stats */}
            <div className="text-center pb-3 border-b border-gray-200">
              <p className="text-2xl font-bold text-purple-600">{data.totalAnalyzed}</p>
              <p className="text-[10px] text-gray-500">Photos analyzed</p>
            </div>

            {/* AI Confidence */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                  AI Confidence
                </span>
                <span className={`text-xs font-bold ${
                  data.avgConfidence >= 85 ? 'text-green-600' :
                  data.avgConfidence >= 70 ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {data.avgConfidence}%
                </span>
              </div>

              {/* Confidence bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    data.avgConfidence >= 85 ? 'bg-green-500' :
                    data.avgConfidence >= 70 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${data.avgConfidence}%` }}
                />
              </div>
            </div>

            {/* AI Model Info */}
            <div className="p-2 rounded-lg bg-purple-50 border border-purple-200">
              <p className="text-[10px] font-semibold text-purple-700 mb-0.5">Gemini 2.0 Flash</p>
              <p className="text-[9px] text-purple-600">Multimodal vision analysis</p>
            </div>

            {/* Analysis breakdown */}
            <div className="space-y-1 pt-2 border-t border-gray-200">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Analysis:
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Incident Type</span>
                <span className="text-gray-700 font-medium">✓</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Severity (1-5)</span>
                <span className="text-gray-700 font-medium">✓</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Location</span>
                <span className="text-gray-700 font-medium">✓</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Routing Decision</span>
                <span className="text-gray-700 font-medium">✓</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const IncidentAnalysisNode = memo(IncidentAnalysisNodeComponent);
