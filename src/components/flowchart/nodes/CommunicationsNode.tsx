import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Mail, Bell, FileText, Send, Presentation } from 'lucide-react';

export interface Communication {
  id: string;
  comm_type: string;
  recipient: string;
  subject: string;
  body?: string;
  sent_at: string;
}

export interface CommunicationsNodeData {
  label: string;
  communications: Communication[];
  onViewCommunications?: () => void;
  onShowInfo?: () => void;
}

interface CommunicationsNodeProps {
  data: CommunicationsNodeData;
}

function CommunicationsNodeComponent({ data }: CommunicationsNodeProps) {
  const hasComms = data.communications.length > 0;

  const getCommIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail;
      case 'alert': return Bell;
      case 'work_order': return FileText;
      default: return Send;
    }
  };

  return (
    <div className={`glass-node min-w-[220px] max-w-[280px] overflow-hidden ${hasComms ? 'glass-node-active' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-white !border-2 !border-gray-400 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-white !border-2 !border-bmf-blue !w-3 !h-3" />

      {/* Header */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-white" />
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
        {data.communications.length === 0 ? (
          <div className="text-center py-4">
            <Send className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No communications sent</p>
            <p className="text-[10px] text-gray-400 mt-1">Notifications will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-center mb-3">
              <p className="text-2xl font-bold text-blue-600">{data.communications.length}</p>
              <p className="text-[10px] text-gray-500">Notifications sent</p>
            </div>

            {/* Communications list */}
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
              {data.communications.slice(0, 4).map((comm) => {
                const Icon = getCommIcon(comm.comm_type);

                return (
                  <div
                    key={comm.id}
                    className="p-2 rounded-lg bg-blue-50 border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={data.onViewCommunications}
                  >
                    <div className="flex items-start gap-2">
                      <div className="p-1 rounded bg-blue-200">
                        <Icon className="w-2.5 h-2.5 text-blue-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-200 text-blue-700 font-medium">
                            {comm.comm_type.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 font-medium truncate">{comm.recipient}</p>
                        <p className="text-[10px] text-gray-500 truncate">{comm.subject}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {data.communications.length > 4 && (
              <p className="text-[10px] text-center text-gray-400 mt-2">
                +{data.communications.length - 4} more sent
              </p>
            )}

            {/* View all button */}
            <button
              onClick={data.onViewCommunications}
              className="w-full mt-3 py-2 px-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Mail className="w-3 h-3" />
              View All Communications
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export const CommunicationsNode = memo(CommunicationsNodeComponent);
