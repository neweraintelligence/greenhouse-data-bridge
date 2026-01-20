import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ClipboardList, Eye, HelpCircle, Presentation } from 'lucide-react';

// Supports both old format (shipping/receiving) and new format (incident reporting)
export interface ReviewQueueIncident {
  id: string;
  // Old format fields
  type?: string;
  summary?: string;
  confidence?: number;
  // New format fields
  incident_type?: string;
  location_code?: string;
  review_reason?: string;
  status?: string;
  ai_confidence?: number;
  // Common - severity can be string ('low'|'medium'|'high'|'critical') or number
  severity: string | number;
}

export interface ReviewQueueNodeData {
  label: string;
  incidents?: ReviewQueueIncident[];
  onShowInfo?: () => void;
  onViewQueue?: () => void;
}

interface ReviewQueueNodeProps {
  data: ReviewQueueNodeData;
}

function ReviewQueueNodeComponent({ data }: ReviewQueueNodeProps) {
  // Guard against undefined data
  if (!data) {
    return (
      <div className="glass-node min-w-[280px] max-w-[320px] overflow-hidden border-2 border-orange-300">
        <div className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">Review Queue</span>
          </div>
        </div>
        <div className="p-4 text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  const incidents = data.incidents || [];
  // Handle both old (confidence) and new (ai_confidence) formats
  const getConfidence = (i: ReviewQueueIncident) => i.ai_confidence ?? i.confidence ?? 100;
  // Handle severity as string ('medium', 'high') or number (3)
  const isModerateSeverity = (sev: string | number) => sev === 'medium' || sev === 3;

  const ambiguousCount = incidents.filter(i => i.review_reason?.includes('mbiguous') || i.type?.includes('ambiguous')).length;
  const lowConfidenceCount = incidents.filter(i => getConfidence(i) < 75).length;
  const moderateCount = incidents.filter(i => isModerateSeverity(i.severity)).length;
  const totalCount = incidents.length;

  return (
    <div className="glass-node min-w-[280px] max-w-[320px] overflow-hidden border-2 border-orange-300">
      <Handle type="target" position={Position.Left} className="!bg-orange-500 !border-2 !border-orange-600 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-orange-600 !border-2 !border-orange-700 !w-3 !h-3" />

      {/* Header */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600">
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
        {totalCount === 0 ? (
          <div className="text-center py-4">
            <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No items pending review</p>
            <p className="text-[10px] text-gray-400 mt-1">All incidents processed</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Total count */}
            <div className="text-center pb-3 border-b border-gray-200">
              <p className="text-2xl font-bold text-orange-600">{totalCount}</p>
              <p className="text-[10px] text-gray-500">Items awaiting review</p>
            </div>

            {/* Review reasons breakdown */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                Review Reasons:
              </p>

              {/* Ambiguous */}
              {ambiguousCount > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-300">
                  <HelpCircle className="w-4 h-4 text-amber-700" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-800">Ambiguous</p>
                    <p className="text-[10px] text-amber-600">Unclear classification</p>
                  </div>
                  <span className="text-sm font-bold text-amber-800">{ambiguousCount}</span>
                </div>
              )}

              {/* Low Confidence */}
              {lowConfidenceCount > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 border border-yellow-300">
                  <Eye className="w-4 h-4 text-yellow-700" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-yellow-800">Low Confidence</p>
                    <p className="text-[10px] text-yellow-600">AI confidence &lt; 75%</p>
                  </div>
                  <span className="text-sm font-bold text-yellow-800">{lowConfidenceCount}</span>
                </div>
              )}

              {/* Moderate Severity */}
              {moderateCount > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 border border-orange-300">
                  <ClipboardList className="w-4 h-4 text-orange-700" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-orange-800">Moderate</p>
                    <p className="text-[10px] text-orange-600">Severity 3 - needs review</p>
                  </div>
                  <span className="text-sm font-bold text-orange-800">{moderateCount}</span>
                </div>
              )}
            </div>

            {/* Pending items */}
            {incidents.length > 0 && (
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pt-2 border-t border-gray-200">
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Pending Review:
                </p>
                {incidents.slice(0, 3).map((incident) => {
                  // Support both old and new formats
                  const title = incident.incident_type || incident.type || 'Unknown';
                  const subtitle = incident.location_code || incident.summary || '';
                  const confidence = getConfidence(incident);

                  return (
                    <div
                      key={incident.id}
                      className="p-1.5 rounded-lg bg-orange-50 border border-orange-200 cursor-pointer hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold truncate">{title}</p>
                          <p className="text-[9px] opacity-75 truncate">{subtitle}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {confidence < 75 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-bold">
                              {confidence}%
                            </span>
                          )}
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold">
                            Sev {incident.severity}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Human-in-the-loop info */}
            <div className="p-2 rounded-lg bg-orange-50 border border-orange-200">
              <p className="text-[10px] font-semibold text-orange-700 mb-0.5">
                Human Review Required
              </p>
              <p className="text-[9px] text-orange-600">
                AI defers to human expertise for ambiguous cases
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const ReviewQueueNode = memo(ReviewQueueNodeComponent);
