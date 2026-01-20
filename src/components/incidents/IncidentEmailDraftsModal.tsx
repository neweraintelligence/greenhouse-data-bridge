import { memo, useState } from 'react';
import { X, Mail, Send, Loader2, AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import type { IncidentEmailDraft } from '../../lib/incidents/incidentEmailDrafts';

interface IncidentEmailDraftsModalProps {
  drafts: IncidentEmailDraft[];
  onClose: () => void;
  onSend?: (draftId: string) => void;
  onSendAll?: () => void;
}

function IncidentEmailDraftsModalComponent({
  drafts,
  onClose,
  onSend,
  onSendAll,
}: IncidentEmailDraftsModalProps) {
  const [expandedDraft, setExpandedDraft] = useState<string | null>(drafts[0]?.id || null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);

  const handleSend = async (draftId: string) => {
    setSendingId(draftId);
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    onSend?.(draftId);
    setSendingId(null);
  };

  const handleSendAll = async () => {
    setSendingAll(true);
    // Simulate sending all
    await new Promise(resolve => setTimeout(resolve, 1500));
    onSendAll?.();
    setSendingAll(false);
    onClose();
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Mail className="w-4 h-4 text-gray-600" />;
    }
  };

  const pendingDrafts = drafts.filter(d => d.status === 'draft');
  // sentDrafts available if needed for display
  // const sentDrafts = drafts.filter(d => d.status === 'sent');

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-lg font-semibold text-white">
                Incident Escalation Emails
              </h2>
              <p className="text-sm text-white/80">
                {pendingDrafts.length} draft{pendingDrafts.length !== 1 ? 's' : ''} ready to send
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Email list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {drafts.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No email drafts</p>
              <p className="text-sm text-gray-400 mt-1">
                Escalation emails will appear here when incidents are reported
              </p>
            </div>
          ) : (
            drafts.map((draft) => (
              <div
                key={draft.id}
                className={`border rounded-xl overflow-hidden transition-all ${
                  draft.status === 'sent' ? 'opacity-60' : ''
                }`}
              >
                {/* Draft header */}
                <button
                  onClick={() => setExpandedDraft(expandedDraft === draft.id ? null : draft.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  {getPriorityIcon(draft.priority)}
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {draft.subject}
                    </p>
                    <p className="text-xs text-gray-500">
                      To: {draft.recipient} ({draft.recipientRole})
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getPriorityStyles(draft.priority)}`}>
                    {draft.priority.toUpperCase()}
                  </span>
                  {draft.status === 'sent' && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  {expandedDraft === draft.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {/* Expanded content */}
                {expandedDraft === draft.id && (
                  <div className="border-t bg-gray-50">
                    <div className="p-4">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                        {draft.body}
                      </pre>
                    </div>

                    {draft.status === 'draft' && (
                      <div className="px-4 py-3 bg-white border-t flex justify-end">
                        <button
                          onClick={() => handleSend(draft.id)}
                          disabled={sendingId === draft.id}
                          className="px-4 py-2 rounded-lg bg-bmf-blue hover:bg-bmf-blue-dark text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {sendingId === draft.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Send Email
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer with Send All */}
        {pendingDrafts.length > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t shrink-0">
            <button
              onClick={handleSendAll}
              disabled={sendingAll}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sendingAll ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending All...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send All {pendingDrafts.length} Emails
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export const IncidentEmailDraftsModal = memo(IncidentEmailDraftsModalComponent);
