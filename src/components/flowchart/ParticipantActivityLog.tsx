import { useState, useEffect } from 'react';
import { Users, UserPlus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Participant {
  id: string;
  participant_name: string;
  node_name: string;
  joined_at: string;
}

interface Activity {
  id: string;
  type: 'join' | 'submission';
  participant_name: string;
  node_name?: string;
  message: string;
  timestamp: string;
}

interface ParticipantActivityLogProps {
  sessionCode: string;
}

export function ParticipantActivityLog({ sessionCode }: ParticipantActivityLogProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Fetch existing participants
    const fetchParticipants = async () => {
      const { data, error } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_code', sessionCode)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching participants:', error);
        return;
      }

      if (data) {
        setParticipants(data);
        // Convert existing participants to activities
        const existingActivities: Activity[] = data.map(p => ({
          id: p.id,
          type: 'join' as const,
          participant_name: p.participant_name,
          node_name: p.node_name,
          message: `${p.participant_name} joined ${p.node_name}`,
          timestamp: p.joined_at,
        }));
        setActivities(existingActivities);
      }
    };

    fetchParticipants();

    // Subscribe to new participants joining
    const channel = supabase
      .channel(`session-${sessionCode}-participants`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_participants',
          filter: `session_code=eq.${sessionCode}`,
        },
        (payload) => {
          const newParticipant = payload.new as Participant;
          setParticipants((prev) => [newParticipant, ...prev]);

          // Add join activity
          const newActivity: Activity = {
            id: newParticipant.id,
            type: 'join',
            participant_name: newParticipant.participant_name,
            node_name: newParticipant.node_name,
            message: `${newParticipant.participant_name} joined ${newParticipant.node_name}`,
            timestamp: newParticipant.joined_at,
          };
          setActivities((prev) => [newActivity, ...prev].slice(0, 20)); // Keep last 20
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionCode]);

  const uniqueParticipants = Array.from(
    new Set(participants.map((p) => p.participant_name))
  );

  return (
    <>
      {/* Minimized bubble button - top left */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="fixed top-6 left-6 z-50 group"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-gray-200/50 hover:bg-white/90 hover:shadow-xl transition-all">
            <Users className="w-5 h-5 text-bmf-blue" />
            {uniqueParticipants.length > 0 && (
              <>
                <span className="text-sm font-semibold text-gray-800">{uniqueParticipants.length}</span>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              </>
            )}
          </div>
        </button>
      )}

      {/* Expanded overlay */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsExpanded(false)}
          />

          {/* Activity panel */}
          <div className="fixed top-6 left-6 z-50 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 animate-in slide-in-from-left duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-bmf-blue/10">
                  <Users className="w-5 h-5 text-bmf-blue" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Activity</h3>
                  <p className="text-xs text-gray-500">{uniqueParticipants.length} active</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[500px] overflow-y-auto">
              {/* Active Participants */}
              {uniqueParticipants.length > 0 && (
                <div className="px-5 py-4 border-b border-gray-200/50">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Active Now
                  </h4>
                  <div className="space-y-2">
                    {uniqueParticipants.slice(0, 5).map((name, idx) => {
                      const latestActivity = participants.find(
                        (p) => p.participant_name === name
                      );
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {latestActivity?.node_name}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="px-5 py-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Recent Activity
                </h4>
                {activities.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">
                    No activity yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activities.slice(0, 10).map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="mt-0.5 p-1.5 rounded-lg bg-bmf-blue/10">
                          <UserPlus className="w-3.5 h-3.5 text-bmf-blue" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 leading-snug">
                            <span className="font-medium text-gray-900">
                              {activity.participant_name}
                            </span>
                            {' '}joined{' '}
                            <span className="text-bmf-blue font-medium">
                              {activity.node_name}
                            </span>
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatTimestamp(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return date.toLocaleDateString();
}
