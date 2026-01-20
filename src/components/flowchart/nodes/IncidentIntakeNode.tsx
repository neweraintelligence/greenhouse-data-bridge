import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Camera, AlertTriangle, ArrowRight, Presentation } from 'lucide-react';

export interface IncidentReport {
  id: string;
  incident_type: string;
  severity: number;
  location_code: string;
  reported_by: string;
  routed_to: string;
  status: string;
}

export interface IncidentIntakeNodeData {
  label: string;
  incidents: IncidentReport[];
  onShowInfo?: () => void;
}

interface IncidentIntakeNodeProps {
  data: IncidentIntakeNodeData;
}

function IncidentIntakeNodeComponent({ data }: IncidentIntakeNodeProps) {
  // Count incidents by routing destination
  const escalationCount = data.incidents.filter((i) => i.severity >= 4).length;
  const reviewCount = data.incidents.filter((i) => i.severity === 3 || (i.severity >= 1 && i.severity < 3)).length;
  const totalCount = data.incidents.length;

  // Get severity color
  const getSeverityColor = (severity: number) => {
    if (severity >= 5) return 'text-red-700 bg-red-100';
    if (severity === 4) return 'text-red-600 bg-red-50';
    if (severity === 3) return 'text-orange-600 bg-orange-50';
    if (severity === 2) return 'text-yellow-600 bg-yellow-50';
    return 'text-blue-600 bg-blue-50';
  };

  return (
    <div className="glass-node min-w-[280px] max-w-[320px] overflow-hidden">
      <Handle type="target" position={Position.Left} className="!bg-white !border-2 !border-gray-400 !w-3 !h-3" />
      {/* Multiple output handles for routing visualization */}
      <Handle
        type="source"
        position={Position.Right}
        id="escalation"
        style={{ top: '30%' }}
        className="!bg-red-500 !border-2 !border-red-600 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="review"
        style={{ top: '50%' }}
        className="!bg-orange-500 !border-2 !border-orange-600 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="log"
        style={{ top: '70%' }}
        className="!bg-blue-500 !border-2 !border-blue-600 !w-3 !h-3"
      />

      {/* Header */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-white" />
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
            <p className="text-xs text-gray-500">No incidents reported</p>
            <p className="text-[10px] text-gray-400 mt-1">Awaiting photo submissions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Total count */}
            <div className="text-center pb-3 border-b border-gray-200">
              <p className="text-2xl font-bold text-purple-600">{totalCount}</p>
              <p className="text-[10px] text-gray-500">Incidents analyzed</p>
            </div>

            {/* Routing breakdown */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Routing Paths:</p>

              {/* Escalation path */}
              {escalationCount > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-red-700">Escalation</p>
                    <p className="text-[10px] text-red-600">Severity 4-5</p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-red-500" />
                  <span className="text-sm font-bold text-red-700">{escalationCount}</span>
                </div>
              )}

              {/* Review path */}
              {reviewCount > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 border border-orange-200">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-orange-700">Review Queue</p>
                    <p className="text-[10px] text-orange-600">Severity 1-3</p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-orange-500" />
                  <span className="text-sm font-bold text-orange-700">{reviewCount}</span>
                </div>
              )}
            </div>

            {/* Recent incidents list */}
            {data.incidents.length > 0 && (
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pt-2 border-t border-gray-200">
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Recent:</p>
                {data.incidents.slice(0, 3).map((incident) => (
                  <div
                    key={incident.id}
                    className={`p-1.5 rounded-lg ${getSeverityColor(incident.severity)} cursor-pointer hover:shadow-sm transition-all`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold truncate">{incident.incident_type}</p>
                        <p className="text-[9px] opacity-75">{incident.location_code}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                          incident.severity >= 5 ? 'bg-red-200 text-red-800' :
                          incident.severity === 4 ? 'bg-red-100 text-red-700' :
                          incident.severity === 3 ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {incident.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const IncidentIntakeNode = memo(IncidentIntakeNodeComponent);
