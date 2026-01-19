import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { AlertOctagon, Zap, ArrowUpRight, Presentation } from 'lucide-react';

export interface EscalationItem {
  id: string;
  source_type: string;
  source_id: string;
  severity: string;
  routed_to: string;
  status: string;
}

export interface EscalationNodeData {
  label: string;
  items: EscalationItem[];
  onViewEscalations?: () => void;
  onShowInfo?: () => void;
}

interface EscalationNodeProps {
  data: EscalationNodeData;
}

function EscalationNodeComponent({ data }: EscalationNodeProps) {
  const hasCritical = data.items.some((i) => i.severity === 'critical');

  return (
    <div
      className={`glass-node min-w-[220px] max-w-[280px] overflow-hidden ${hasCritical ? 'animate-pulse' : ''}`}
    >
      <Handle type="target" position={Position.Left} className="!bg-white !border-2 !border-gray-400 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-white !border-2 !border-bmf-blue !w-3 !h-3" />

      {/* Header */}
      <div
        className={`px-4 py-2.5 ${
          hasCritical
            ? 'bg-gradient-to-r from-red-600 to-red-700'
            : 'bg-gradient-to-r from-red-500 to-orange-600'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-white" />
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
            <AlertOctagon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No escalations</p>
            <p className="text-[10px] text-gray-400 mt-1">All items within normal parameters</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-center mb-3">
              <p className="text-2xl font-bold text-red-600">{data.items.length}</p>
              <p className="text-[10px] text-gray-500">Escalated items</p>
            </div>

            {/* Escalation list */}
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
              {data.items.map((item) => {
                const isCritical = item.severity === 'critical';

                return (
                  <div
                    key={item.id}
                    className={`p-2 rounded-lg border cursor-pointer hover:shadow-md transition-all ${
                      isCritical
                        ? 'bg-red-100 border-red-300'
                        : 'bg-orange-100 border-orange-300'
                    }`}
                    onClick={data.onViewEscalations}
                  >
                    <div className="flex items-start gap-2">
                      {isCritical && <Zap className="w-3 h-3 text-red-600 shrink-0 mt-0.5 animate-pulse" />}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                            isCritical ? 'bg-red-200 text-red-700' : 'bg-orange-200 text-orange-700'
                          }`}>
                            {item.severity.toUpperCase()}
                          </span>
                          <span className="text-[9px] text-gray-600 truncate">{item.source_id}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <ArrowUpRight className="w-2.5 h-2.5 text-gray-500" />
                          <span className="text-gray-700 font-medium truncate">{item.routed_to}</span>
                        </div>
                        <p className="text-[9px] text-gray-500 mt-0.5">
                          {item.status.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View details button */}
            <button
              onClick={data.onViewEscalations}
              className="w-full mt-3 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <AlertOctagon className="w-3 h-3" />
              View Escalations
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export const EscalationNode = memo(EscalationNodeComponent);
