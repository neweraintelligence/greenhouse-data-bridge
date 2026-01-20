import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileText, TrendingDown, Presentation } from 'lucide-react';

export interface LoggedIncident {
  id: string;
  incident_type: string;
  severity: number;
  location_code: string;
  status: string;
  created_at: string;
}

export interface IncidentHistoryNodeData {
  label: string;
  incidents: LoggedIncident[];
  onShowInfo?: () => void;
}

interface IncidentHistoryNodeProps {
  data: IncidentHistoryNodeData;
}

function IncidentHistoryNodeComponent({ data }: IncidentHistoryNodeProps) {
  const totalCount = data.incidents.length;
  const resolvedCount = data.incidents.filter(i => i.status === 'resolved').length;
  const minorCount = data.incidents.filter(i => i.severity <= 2).length;

  return (
    <div className="glass-node min-w-[280px] max-w-[320px] overflow-hidden border-2 border-blue-300">
      <Handle type="target" position={Position.Left} className="!bg-blue-500 !border-2 !border-blue-600 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-blue-600 !border-2 !border-blue-700 !w-3 !h-3" />

      <div className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-white" />
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

      <div className="p-4 bg-white/90">
        {totalCount === 0 ? (
          <div className="text-center py-4">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No logged incidents</p>
            <p className="text-[10px] text-gray-400 mt-1">History will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center pb-3 border-b border-gray-200">
              <p className="text-2xl font-bold text-blue-600">{totalCount}</p>
              <p className="text-[10px] text-gray-500">Incidents logged</p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                Status Breakdown:
              </p>

              {minorCount > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-200">
                  <TrendingDown className="w-4 h-4 text-blue-700" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-800">Minor</p>
                    <p className="text-[10px] text-blue-600">Severity 1-2</p>
                  </div>
                  <span className="text-sm font-bold text-blue-800">{minorCount}</span>
                </div>
              )}

              {resolvedCount > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200">
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-green-800">Resolved</p>
                    <p className="text-[10px] text-green-600">Closed incidents</p>
                  </div>
                  <span className="text-sm font-bold text-green-800">{resolvedCount}</span>
                </div>
              )}
            </div>

            {data.incidents.length > 0 && (
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pt-2 border-t border-gray-200">
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Recent Logs:
                </p>
                {data.incidents.slice(0, 3).map((incident) => (
                  <div
                    key={incident.id}
                    className={'p-1.5 rounded-lg cursor-pointer hover:shadow-sm transition-all ' + (incident.status === 'resolved' ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold truncate">{incident.incident_type}</p>
                        <p className="text-[9px] opacity-75">{incident.location_code}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={'text-[9px] px-1.5 py-0.5 rounded-full font-bold ' + (incident.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700')}>
                          {incident.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-[10px] font-semibold text-blue-700 mb-0.5">
                Pattern Analysis
              </p>
              <p className="text-[9px] text-blue-600">
                Logged for tracking trends and preventive maintenance
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const IncidentHistoryNode = memo(IncidentHistoryNodeComponent);
