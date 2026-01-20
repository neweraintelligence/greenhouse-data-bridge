import { useState, useEffect } from 'react';
import { X, History, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Activity {
  id: string;
  message: string;
  timestamp: Date;
  type: 'join' | 'shipment' | 'training' | 'incident' | 'scan' | 'order' | 'quality' | 'email' | 'challenge';
  isCorrect?: boolean; // For challenge results
}

interface ParticipantActivityLogProps {
  sessionCode: string;
}

export function ParticipantActivityLog({ sessionCode }: ParticipantActivityLogProps) {
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]); // Last 5 for display
  const [allActivities, setAllActivities] = useState<Activity[]>([]); // Full history
  const [isLive, setIsLive] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!sessionCode) return;

    console.log('[ActivityLog] Subscribing to session:', sessionCode);

    const channel = supabase
      .channel(`activity-${sessionCode}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'session_participants', filter: `session_code=eq.${sessionCode}` },
        (payload) => {
          console.log('[ActivityLog] Participant joined:', payload.new);
          const p = payload.new as { participant_name: string };
          addActivity(`${p.participant_name} joined`, 'join');
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'shipments_expected', filter: `session_code=eq.${sessionCode}` },
        (payload) => {
          console.log('[ActivityLog] Shipment added:', payload.new);
          const s = payload.new as { shipment_id: string; submitted_by?: string };
          const who = s.submitted_by || 'Someone';
          addActivity(`${who} added shipment ${s.shipment_id}`, 'shipment');
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'training_roster', filter: `session_code=eq.${sessionCode}` },
        (payload) => {
          console.log('[ActivityLog] Training entry:', payload.new);
          const t = payload.new as { name: string; submitted_by?: string };
          const who = t.submitted_by || 'Someone';
          addActivity(`${who} added ${t.name} to training`, 'training');
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'incidents', filter: `session_code=eq.${sessionCode}` },
        (payload) => {
          console.log('[ActivityLog] Incident reported:', payload.new);
          const i = payload.new as { incident_type: string; reported_by?: string; submitted_by?: string };
          const who = i.submitted_by || i.reported_by || 'Someone';
          addActivity(`${who} reported ${i.incident_type || 'incident'}`, 'incident');
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'barcode_scans', filter: `session_code=eq.${sessionCode}` },
        (payload) => {
          console.log('[ActivityLog] Barcode scanned:', payload.new);
          const b = payload.new as { shipment_id: string; scanned_by?: string };
          const who = b.scanned_by || 'Someone';
          addActivity(`${who} scanned ${b.shipment_id}`, 'scan');
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'customer_orders', filter: `session_code=eq.${sessionCode}` },
        (payload) => {
          console.log('[ActivityLog] Customer order:', payload.new);
          const o = payload.new as { customer_name?: string; po_number?: string; submitted_by?: string };
          const who = o.submitted_by || 'Someone';
          addActivity(`${who} added order ${o.po_number || ''}`, 'order');
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'quality_issues', filter: `session_code=eq.${sessionCode}` },
        (payload) => {
          console.log('[ActivityLog] Quality issue:', payload.new);
          const q = payload.new as { issue_type?: string; submitted_by?: string };
          const who = q.submitted_by || 'Someone';
          addActivity(`${who} flagged ${q.issue_type || 'quality issue'}`, 'quality');
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'communications_log', filter: `session_code=eq.${sessionCode}` },
        (payload) => {
          console.log('[ActivityLog] Email sent:', payload.new);
          const c = payload.new as { comm_type?: string; submitted_by?: string };
          const who = c.submitted_by || 'Someone';
          addActivity(`${who} sent ${c.comm_type || 'message'}`, 'email');
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'billing_challenge_responses', filter: `session_code=eq.${sessionCode}` },
        (payload) => {
          console.log('[ActivityLog] Challenge response:', payload.new);
          const r = payload.new as { participant_name: string; is_correct: boolean; time_taken_ms: number };
          const time = (r.time_taken_ms / 1000).toFixed(1);
          const message = r.is_correct
            ? `${r.participant_name} got it right in ${time}s!`
            : `${r.participant_name} answered in ${time}s`;
          addActivity(message, 'challenge', r.is_correct);
        }
      )
      .subscribe((status) => {
        console.log('[ActivityLog] Subscription status:', status);
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('[ActivityLog] Unsubscribing from session:', sessionCode);
      channel.unsubscribe();
    };
  }, [sessionCode]);

  const addActivity = (message: string, type: Activity['type'], isCorrect?: boolean) => {
    const id = `${Date.now()}-${Math.random()}`;
    const activity: Activity = { id, message, timestamp: new Date(), type, isCorrect };

    // Add to full history
    setAllActivities((prev) => [...prev, activity]);

    // Add to recent display
    setRecentActivities((prev) => [...prev, activity].slice(-5));

    // Fade out from recent after 6 seconds
    setTimeout(() => {
      setRecentActivities((prev) => prev.filter((a) => a.id !== id));
    }, 6000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <>
      {/* Main activity log - bottom left */}
      <div className="fixed bottom-6 left-6 z-[10005] flex flex-col-reverse">
        {/* Updates indicator - clickable to show history */}
        {isLive && (
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2 mt-2 pointer-events-auto hover:scale-105 transition-transform cursor-pointer"
          >
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/60">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              <span className="text-[9px] font-medium tracking-wider text-white/70 uppercase">Updates</span>
              {allActivities.length > 0 && (
                <span className="text-[9px] font-mono text-white/50">({allActivities.length})</span>
              )}
            </div>
          </button>
        )}

        {/* Activity stream - messages appear above the indicator */}
        <div className="space-y-2 pointer-events-none">
          {recentActivities.map((activity) => (
            <div
              key={activity.id}
              className="activity-pill"
            >
              {activity.type === 'challenge' && (
                <span className="mr-1.5">
                  {activity.isCorrect ? (
                    <CheckCircle2 className="inline w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <XCircle className="inline w-3.5 h-3.5 text-gray-400" />
                  )}
                </span>
              )}
              <span className="activity-text">{activity.message}</span>
              <div className="shimmer" />
            </div>
          ))}
        </div>

        <style>{`
          .activity-pill {
            position: relative;
            display: inline-block;
            padding: 6px 14px;
            border-radius: 20px;
            background: linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(20,20,20,0.85) 100%);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255,255,255,0.1);
            overflow: hidden;
            animation: slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1), fadeOut 0.4s ease-out 5.6s forwards;
          }

          .activity-text {
            position: relative;
            z-index: 1;
            font-size: 13px;
            font-weight: 500;
            color: white;
            letter-spacing: 0.01em;
          }

          .shimmer {
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(255,255,255,0.08) 50%,
              transparent 100%
            );
            animation: shimmer 1.5s ease-in-out;
          }

          @keyframes slideIn {
            0% {
              opacity: 0;
              transform: translateX(-16px);
            }
            100% {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 200%; }
          }

          @keyframes fadeOut {
            0% { opacity: 1; }
            100% { opacity: 0; }
          }
        `}</style>
      </div>

      {/* History panel - slides up from bottom */}
      {showHistory && (
        <div
          className="fixed inset-0 z-[10010] flex items-end justify-start p-6"
          onClick={() => setShowHistory(false)}
        >
          {/* Subtle backdrop */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

          {/* History panel */}
          <div
            className="relative w-96 max-h-[70vh] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-100 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-800">Activity History</h3>
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                  {allActivities.length} events
                </span>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Activity list */}
            <div className="overflow-y-auto max-h-[calc(70vh-56px)]">
              {allActivities.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-sm">No activity yet</p>
                  <p className="text-xs text-gray-400 mt-1">Waiting for participants...</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {[...allActivities].reverse().map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      {/* Icon based on type */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        activity.type === 'join' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'challenge' ? (activity.isCorrect ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500') :
                        activity.type === 'incident' ? 'bg-red-100 text-red-600' :
                        activity.type === 'quality' ? 'bg-amber-100 text-amber-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {activity.type === 'challenge' ? (
                          activity.isCorrect ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )
                        ) : (
                          <span className="text-xs font-bold">
                            {activity.type === 'join' ? '+' :
                             activity.type === 'shipment' ? '📦' :
                             activity.type === 'training' ? '📋' :
                             activity.type === 'incident' ? '⚠️' :
                             activity.type === 'scan' ? '📱' :
                             activity.type === 'order' ? '🛒' :
                             activity.type === 'quality' ? '🔍' :
                             activity.type === 'email' ? '✉️' : '•'}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">{activity.message}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatTime(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
