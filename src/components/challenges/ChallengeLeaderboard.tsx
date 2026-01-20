import { useState, useEffect } from 'react';
import { Trophy, Clock, CheckCircle2, XCircle, Users, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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

  // Fetch initial data and subscribe to changes
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

    // Subscribe to new entries
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

  // Get ranked entries (only correct ones, sorted by time)
  const rankedEntries = entries
    .filter((e) => e.is_correct)
    .sort((a, b) => a.time_taken_ms - b.time_taken_ms)
    .slice(0, 10);

  // Get recent activity (all entries, sorted by time)
  const recentActivity = [...entries]
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Challenge Leaderboard</h2>
              <p className="text-amber-100 text-sm">Fastest correct answers win!</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-white">
            <div className="text-center">
              <Users className="w-5 h-5 mx-auto mb-1 opacity-80" />
              <span className="text-2xl font-bold">{stats.total}</span>
              <p className="text-xs opacity-80">Participants</p>
            </div>
            <div className="text-center">
              <CheckCircle2 className="w-5 h-5 mx-auto mb-1 opacity-80" />
              <span className="text-2xl font-bold">{Math.round((stats.correct / stats.total) * 100) || 0}%</span>
              <p className="text-xs opacity-80">Accuracy</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {entries.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Waiting for participants...</p>
            <p className="text-sm text-gray-400">Scan the QR code to join the challenge!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {/* Podium / Top 3 */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Top Performers</h3>

              {rankedEntries.length === 0 ? (
                <p className="text-gray-400 text-sm">No correct answers yet</p>
              ) : (
                <div className="space-y-2">
                  {rankedEntries.slice(0, 5).map((entry, idx) => (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-3 p-3 rounded-xl ${
                        idx === 0
                          ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200'
                          : idx === 1
                          ? 'bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200'
                          : idx === 2
                          ? 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200'
                          : 'bg-gray-50 border border-gray-100'
                      }`}
                    >
                      {/* Rank badge */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        idx === 0
                          ? 'bg-amber-400 text-white'
                          : idx === 1
                          ? 'bg-gray-400 text-white'
                          : idx === 2
                          ? 'bg-orange-400 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {idx + 1}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{entry.participant_name}</p>
                        <p className="text-xs text-gray-500">
                          {entry.challenge_type === 'price' ? 'Price Check' : 'Quantity Check'}
                        </p>
                      </div>

                      {/* Time */}
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span className="font-mono font-bold">
                            {(entry.time_taken_ms / 1000).toFixed(1)}s
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Submissions</h3>

              <div className="space-y-2">
                {recentActivity.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                  >
                    {entry.is_correct ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                    )}
                    <span className="text-sm text-gray-700 truncate flex-1">{entry.participant_name}</span>
                    <span className="text-xs text-gray-400 font-mono">
                      {(entry.time_taken_ms / 1000).toFixed(1)}s
                    </span>
                  </div>
                ))}
              </div>

              {/* AI speed comparison */}
              <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">AI Comparison</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg human time:</span>
                  <span className="font-mono font-bold text-gray-800">{stats.avgTime.toFixed(1)}s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">AI processing:</span>
                  <span className="font-mono font-bold text-blue-600">&lt; 0.1s</span>
                </div>
                <div className="mt-2 pt-2 border-t border-blue-200 text-center">
                  <span className="text-xs text-blue-600">
                    AI is {Math.round(stats.avgTime / 0.1)}x faster
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
