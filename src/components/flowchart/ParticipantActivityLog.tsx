import { useState, useEffect } from 'react';
import { Users, Minimize2, Maximize2, UserPlus, Plus, X } from 'lucide-react';
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
  const [isMinimized, setIsMinimized] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isVisible, setIsVisible] = useState(true);

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

          // Show toast notification
          showToast(newActivity.message);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionCode]);

  const showToast = (message: string) => {
    // Simple toast notification (you can enhance this with a proper toast library)
    console.log('🔔', message);
  };

  const uniqueParticipants = Array.from(
    new Set(participants.map((p) => p.participant_name))
  );

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-bmf-blue text-white shadow-lg hover:bg-bmf-blue-dark transition-all flex items-center gap-2"
      >
        <Users className="w-5 h-5" />
        {uniqueParticipants.length > 0 && (
          <span className="text-sm font-medium">{uniqueParticipants.length}</span>
        )}
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all ${
        isMinimized ? 'w-64' : 'w-80'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-bmf-blue to-bmf-blue-dark rounded-t-2xl">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-white" />
          <span className="text-sm font-semibold text-white">Participants</span>
          <span className="px-2 py-0.5 text-xs font-medium bg-white/20 text-white rounded-full">
            {uniqueParticipants.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4 text-white" />
            ) : (
              <Minimize2 className="w-4 h-4 text-white" />
            )}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            title="Hide"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="max-h-96 overflow-y-auto">
          {/* Active Participants */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Active Now
            </h3>
            {uniqueParticipants.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                No participants yet
              </p>
            ) : (
              <div className="space-y-2">
                {uniqueParticipants.slice(0, 5).map((name, idx) => {
                  const latestActivity = participants.find(
                    (p) => p.participant_name === name
                  );
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="font-medium text-gray-800">{name}</span>
                      <span className="text-xs text-gray-400">
                        in {latestActivity?.node_name}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Recent Activity
            </h3>
            {activities.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                No activity yet
              </p>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 10).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-2 text-sm"
                  >
                    <div className="mt-0.5">
                      {activity.type === 'join' ? (
                        <UserPlus className="w-4 h-4 text-bmf-blue" />
                      ) : (
                        <Plus className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700">
                        <span className="font-medium">
                          {activity.participant_name}
                        </span>{' '}
                        {activity.type === 'join' ? 'joined' : 'added data to'}{' '}
                        <span className="text-bmf-blue">
                          {activity.node_name}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
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
