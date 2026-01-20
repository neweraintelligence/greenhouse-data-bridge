import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, MessageSquare, User, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ReviewDecision {
  id: string;
  session_code: string;
  item_type: string;
  item_id: string;
  decision: 'accept' | 'reject';
  decided_by: string;
  comment: string | null;
  created_at: string;
}

interface ReviewItem {
  id: string;
  field_name: string;
  source_a_label: string;
  source_a_value: string;
  source_b_label: string;
  source_b_value: string;
  ai_confidence: number | null;
  ai_suggestion: string | null;
  severity: string;
}

interface ReviewDecisionsPanelProps {
  sessionCode: string;
}

export function ReviewDecisionsPanel({ sessionCode }: ReviewDecisionsPanelProps) {
  const [decisions, setDecisions] = useState<(ReviewDecision & { item?: ReviewItem })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, accepted: 0, rejected: 0, pending: 0 });

  useEffect(() => {
    if (!sessionCode) return;

    loadDecisions();

    const channel = supabase
      .channel(`review-decisions-${sessionCode}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'review_decisions',
          filter: `session_code=eq.${sessionCode}`,
        },
        () => {
          loadDecisions();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionCode]);

  const loadDecisions = async () => {
    try {
      const { data: items } = await supabase
        .from('review_queue_items')
        .select('*')
        .eq('session_code', sessionCode);

      const { data: decisionData, error } = await supabase
        .from('review_decisions')
        .select('*')
        .eq('session_code', sessionCode)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const decisionsWithItems = (decisionData || []).map(decision => {
        const item = items?.find(i => i.id === decision.item_id);
        return { ...decision, item };
      });

      setDecisions(decisionsWithItems);

      const itemCount = items?.length || 0;
      const accepted = (decisionData || []).filter(d => d.decision === 'accept').length;
      const rejected = (decisionData || []).filter(d => d.decision === 'reject').length;
      setStats({
        total: itemCount,
        accepted,
        rejected,
        pending: itemCount - accepted - rejected,
      });
    } catch (err) {
      console.error('Error loading decisions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Review Decisions</h3>
          <p className="text-sm text-gray-500">Human judgments on AI-flagged items</p>
        </div>
        <button
          onClick={loadDecisions}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-gray-50 text-center">
          <p className="text-xl font-semibold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500">Flagged</p>
        </div>
        <div className="p-3 rounded-lg bg-gray-50 text-center">
          <p className="text-xl font-semibold text-green-600">{stats.accepted}</p>
          <p className="text-xs text-gray-500">Accepted</p>
        </div>
        <div className="p-3 rounded-lg bg-gray-50 text-center">
          <p className="text-xl font-semibold text-red-600">{stats.rejected}</p>
          <p className="text-xs text-gray-500">Rejected</p>
        </div>
        <div className="p-3 rounded-lg bg-gray-50 text-center">
          <p className="text-xl font-semibold text-gray-600">{stats.pending}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
      </div>

      {/* Decision list */}
      {decisions.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">No decisions yet</p>
          <p className="text-xs text-gray-400">Waiting for reviewers...</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[350px] overflow-y-auto">
          {decisions.map((decision) => (
            <div
              key={decision.id}
              className="p-4 rounded-lg border border-gray-200 bg-white"
            >
              {/* Decision header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {decision.decision === 'accept' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={`font-medium ${
                    decision.decision === 'accept' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {decision.decision === 'accept' ? 'Accepted' : 'Rejected'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-400 text-xs">
                  <Clock className="w-3 h-3" />
                  {new Date(decision.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Reviewer */}
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">{decision.decided_by}</span>
              </div>

              {/* Item details */}
              {decision.item && (
                <div className="p-3 rounded-lg bg-gray-50 mb-3">
                  <p className="text-xs text-gray-500 mb-2">{decision.item.field_name}</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400">{decision.item.source_a_label}</span>
                      <p className="font-medium text-gray-700 mt-0.5">{decision.item.source_a_value}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">{decision.item.source_b_label}</span>
                      <p className="font-medium text-gray-700 mt-0.5">{decision.item.source_b_value}</p>
                    </div>
                  </div>
                  {decision.item.ai_confidence !== null && (
                    <p className="mt-2 text-xs text-gray-500">
                      AI confidence: {decision.item.ai_confidence}%
                    </p>
                  )}
                </div>
              )}

              {/* Comment */}
              {decision.comment && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50">
                  <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-600">"{decision.comment}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Insight */}
      {decisions.length > 0 && (
        <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
          <p className="text-xs font-medium text-gray-700 mb-1">Summary</p>
          <p className="text-xs text-gray-500">
            {stats.accepted > stats.rejected
              ? "Most flagged items were accepted - AI may be over-flagging."
              : stats.rejected > stats.accepted
              ? "Most flagged items were rejected - AI's caution was warranted."
              : "Mixed decisions - human judgment is essential for these edge cases."}
          </p>
        </div>
      )}
    </div>
  );
}
