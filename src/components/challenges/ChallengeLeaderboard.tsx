import { useState, useEffect } from 'react';
import { Trophy, Clock, CheckCircle2, XCircle, Users, Bot } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ReconciliationReveal } from './ReconciliationReveal';

interface LeaderboardEntry {
  id: string;
  participant_name: string;
  is_correct: boolean;
  time_taken_ms: number;
  rank: number | null;
  challenge_type: string;
  submitted_at: string;
}

interface ChallengeLeaderboardProps {
  sessionCode: string;
}

export function ChallengeLeaderboard({ sessionCode }: ChallengeLeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, correct: 0, avgTime: 0 });
  const [showFullReveal, setShowFullReveal] = useState(false);

  useEffect(() => {
    if (!sessionCode) return;

    const fetchEntries = async () => {
      const { data, error } = await supabase
        .from('billing_challenge_responses')
        .select('*')
        .eq('session_code', sessionCode)
        .order('submitted_at', { ascending: true });

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
      }

      setEntries(data || []);
      updateStats(data || []);
      setIsLoading(false);
    };

    fetchEntries();

    const channel = supabase
      .channel(`leaderboard-${sessionCode}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'billing_challenge_responses',
          filter: `session_code=eq.${sessionCode}`,
        },
        (payload) => {
          const newEntry = payload.new as LeaderboardEntry;
          setEntries((prev) => {
            const updated = [...prev, newEntry];
            updateStats(updated);
            return updated;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'billing_challenge_responses',
          filter: `session_code=eq.${sessionCode}`,
        },
        (payload) => {
          const updatedEntry = payload.new as LeaderboardEntry;
          setEntries((prev) => {
            const updated = prev.map((e) => (e.id === updatedEntry.id ? updatedEntry : e));
            updateStats(updated);
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionCode]);

  const updateStats = (data: LeaderboardEntry[]) => {
    const total = data.length;
    const correct = data.filter((e) => e.is_correct).length;
    const avgTime = total > 0
      ? data.reduce((sum, e) => sum + e.time_taken_ms, 0) / total / 1000
      : 0;
    setStats({ total, correct, avgTime });
  };

  const rankedEntries = entries
    .filter((e) => e.is_correct)
    .sort((a, b) => a.time_taken_ms - b.time_taken_ms)
    .slice(0, 10);

  const recentActivity = [...entries]
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-100 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-50 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-gray-700" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Leaderboard</h2>
              <p className="text-sm text-gray-500">Fastest correct answers</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Participants</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">{Math.round((stats.correct / stats.total) * 100) || 0}%</p>
              <p className="text-xs text-gray-500">Accuracy</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {entries.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Waiting for participants...</p>
            <p className="text-sm text-gray-400 mt-1">Scan the QR code to join</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {/* Top Performers */}
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Top Performers</h3>

              {rankedEntries.length === 0 ? (
                <p className="text-gray-400 text-sm">No correct answers yet</p>
              ) : (
                <div className="space-y-2">
                  {rankedEntries.slice(0, 5).map((entry, idx) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
                        idx === 0 ? 'bg-gray-900 text-white' :
                        idx === 1 ? 'bg-gray-700 text-white' :
                        idx === 2 ? 'bg-gray-500 text-white' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{entry.participant_name}</p>
                        <p className="text-xs text-gray-500">
                          {entry.challenge_type === 'price' ? 'Price Check' : 'Quantity Check'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-mono text-sm font-medium">
                          {(entry.time_taken_ms / 1000).toFixed(1)}s
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Recent Submissions</h3>

              <div className="space-y-2">
                {recentActivity.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50"
                  >
                    {entry.is_correct ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    )}
                    <span className="text-sm text-gray-700 truncate flex-1">{entry.participant_name}</span>
                    <span className="text-xs text-gray-400 font-mono">
                      {(entry.time_taken_ms / 1000).toFixed(1)}s
                    </span>
                  </div>
                ))}
              </div>

              {/* AI Comparison */}
              <div className="mt-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">AI Comparison</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Avg human time:</span>
                    <span className="font-mono font-medium text-gray-900">{stats.avgTime.toFixed(1)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">AI processing:</span>
                    <span className="font-mono font-medium text-gray-900">&lt; 0.1s</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    AI is {Math.round(stats.avgTime / 0.1)}x faster
                  </p>
                </div>

                <button
                  onClick={() => setShowFullReveal(true)}
                  className="mt-3 w-full py-2 px-3 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Bot className="w-4 h-4" />
                  Show Full AI Analysis
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full Reconciliation Reveal Modal */}
      {showFullReveal && (
        <div
          className="fixed inset-0 z-[10020] flex items-center justify-center p-8 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowFullReveal(false)}
        >
          <div
            className="max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <ReconciliationReveal
              sessionCode={sessionCode}
              onClose={() => setShowFullReveal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
