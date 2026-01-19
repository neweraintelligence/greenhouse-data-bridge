import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ClipboardList, AlertTriangle, Clock, Presentation } from 'lucide-react';

export interface ReviewItem {
  id: string;
  type: string;
  severity: string;
  summary: string;
  confidence?: number;
}

export interface ReviewQueueNodeData {
  label: string;
  items: ReviewItem[];
  onViewQueue?: () => void;
  onShowInfo?: () => void;
}

interface ReviewQueueNodeProps {
  data: ReviewQueueNodeData;
}

function ReviewQueueNodeComponent({ data }: ReviewQueueNodeProps) {
  const hasItems = data.items.length > 0;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-amber-600 bg-amber-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  return (
    <div
      className={`glass-node min-w-[220px] max-w-[280px] overflow-hidden ${hasItems ? 'glass-node-active' : ''}`}
    >
      <Handle type="target" position={Position.Left} className="!bg-white !border-2 !border-gray-400 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-white !border-2 !border-bmf-blue !w-3 !h-3" />

      {/* Header */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-white" />
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
        {data.items.length === 0 ? (
          <div className="text-center py-4">
            <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No items need review</p>
            <p className="text-[10px] text-gray-400 mt-1">All records processed cleanly</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-center mb-3">
              <p className="text-2xl font-bold text-amber-600">{data.items.length}</p>
              <p className="text-[10px] text-gray-500">Items need review</p>
            </div>

            {/* Item list preview */}
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
              {data.items.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="p-2 rounded-lg bg-amber-50 border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors"
                  onClick={data.onViewQueue}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${getSeverityColor(item.severity)}`}>
                          {item.severity.toUpperCase()}
                        </span>
                        {item.confidence !== undefined && (
                          <span className="text-[9px] text-gray-500">
                            {item.confidence}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 truncate">{item.summary}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {data.items.length > 4 && (
              <p className="text-[10px] text-center text-gray-400 mt-2">
                +{data.items.length - 4} more items
              </p>
            )}

            {/* View all button */}
            <button
              onClick={data.onViewQueue}
              className="w-full mt-3 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Clock className="w-3 h-3" />
              Review All Items
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export const ReviewQueueNode = memo(ReviewQueueNodeComponent);
