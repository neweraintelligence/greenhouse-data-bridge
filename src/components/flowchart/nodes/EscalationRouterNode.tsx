import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { AlertTriangle, Siren, Users, Presentation } from 'lucide-react';

export interface EscalatedIncident {
  id: string;
  incident_type: string;
  severity: number;
  location_code: string;
  routed_to: string;
  status: string;
}

export interface EscalationRouterNodeData {
  label: string;
  incidents: EscalatedIncident[];
  onShowInfo?: () => void;
}

interface EscalationRouterNodeProps {
  data: EscalationRouterNodeData;
}

function EscalationRouterNodeComponent({ data }: EscalationRouterNodeProps) {
  const criticalCount = data.incidents.filter(i => i.severity >= 5).length;
  const highCount = data.incidents.filter(i => i.severity === 4).length;
  const totalCount = data.incidents.length;

  return (
    <div className="glass-node min-w-[280px] max-w-[320px] overflow-hidden border-2 border-red-300">
      <Handle type="target" position={Position.Left} className="!bg-red-500 !border-2 !border-red-600 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-red-600 !border-2 !border-red-700 !w-3 !h-3" />

      {/* Header */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Siren className="w-4 h-4 text-white animate-pulse" />
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
            <AlertTriangle className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No critical incidents</p>
            <p className="text-[10px] text-gray-400 mt-1">System monitoring...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Total count */}
            <div className="text-center pb-3 border-b border-gray-200">
              <p className="text-2xl font-bold text-red-600">{totalCount}</p>
              <p className="text-[10px] text-gray-500">Critical escalations</p>
            </div>

            {/* Severity breakdown */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                Severity Breakdown:
              </p>

              {/* Critical (5) */}
              {criticalCount > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-100 border-2 border-red-300">
                  <Siren className="w-4 h-4 text-red-700 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-red-800">CRITICAL</p>
                    <p className="text-[10px] text-red-600">Severity 5 - Immediate action</p>
                  </div>
                  <span className="text-sm font-bold text-red-800">{criticalCount}</span>
                </div>
              )}

              {/* High (4) */}
              {highCount > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 border border-orange-300">
                  <AlertTriangle className="w-4 h-4 text-orange-700" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-orange-800">HIGH</p>
                    <p className="text-[10px] text-orange-600">Severity 4 - Urgent response</p>
                  </div>
                  <span className="text-sm font-bold text-orange-800">{highCount}</span>
                </div>
              )}
            </div>

            {/* Recent escalations */}
            {data.incidents.length > 0 && (
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pt-2 border-t border-gray-200">
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Recent Escalations:
                </p>
                {data.incidents.slice(0, 3).map((incident) => (
                  <div
                    key={incident.id}
                    className={`p-1.5 rounded-lg cursor-pointer hover:shadow-sm transition-all ${
                      incident.severity >= 5
                        ? 'bg-red-100 border border-red-200'
                        : 'bg-orange-50 border border-orange-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold truncate">{incident.incident_type}</p>
                        <p className="text-[9px] opacity-75">{incident.location_code}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                          incident.severity >= 5
                            ? 'bg-red-200 text-red-800'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {incident.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Auto-routing info */}
            <div className="p-2 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-3 h-3 text-red-600" />
                <p className="text-[10px] font-semibold text-red-700">Auto-Routed To:</p>
              </div>
              <div className="space-y-0.5">
                {data.incidents.some(i => i.routed_to === 'Safety Team') && (
                  <p className="text-[9px] text-red-600">• Safety Team</p>
                )}
                {data.incidents.some(i => i.routed_to === 'Maintenance Team') && (
                  <p className="text-[9px] text-red-600">• Maintenance Team</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const EscalationRouterNode = memo(EscalationRouterNodeComponent);
