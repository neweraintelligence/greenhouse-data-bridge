import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Activity {
  id: string;
  message: string;
}

interface ParticipantActivityLogProps {
  sessionCode: string;
}

export function ParticipantActivityLog({ sessionCode }: ParticipantActivityLogProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLive, setIsLive] = useState(false);

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
          addActivity(`${p.participant_name} joined`);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'shipments_expected', filter: `session_code=eq.${sessionCode}` },
        (payload) => {
          console.log('[ActivityLog] Shipment added:', payload.new);
          const s = payload.new as { shipment_id: string; submitted_by?: string };
          const who = s.submitted_by || 'Someone';
          addActivity(`${who} added shipment ${s.shipment_id}`);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'training_roster', filter: `session_code=eq.${sessionCode}` },
        (payload) => {
          console.log('[ActivityLog] Training entry:', payload.new);
          const t = payload.new as { name: string; submitted_by?: string };
          const who = t.submitted_by || 'Someone';
          addActivity(`${who} added ${t.name} to training`);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'incidents', filter: `session_code=eq.${sessionCode}` },
        (payload) => {
          console.log('[ActivityLog] Incident reported:', payload.new);
          const i = payload.new as { incident_type: string; reported_by?: string; submitted_by?: string };
          const who = i.submitted_by || i.reported_by || 'Someone';
          addActivity(`${who} reported ${i.incident_type || 'incident'}`);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'barcode_scans', filter: `session_code=eq.${sessionCode}` },
        (payload) => {
          console.log('[ActivityLog] Barcode scanned:', payload.new);
          const b = payload.new as { shipment_id: string; scanned_by?: string };
          const who = b.scanned_by || 'Someone';
          addActivity(`${who} scanned ${b.shipment_id}`);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'customer_orders', filter: `session_code=eq.${sessionCode}` },
        (payload) => {
          console.log('[ActivityLog] Customer order:', payload.new);
          const o = payload.new as { customer_name?: string; po_number?: string; submitted_by?: string };
          const who = o.submitted_by || 'Someone';
          addActivity(`${who} added order ${o.po_number || ''}`);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'quality_issues', filter: `session_code=eq.${sessionCode}` },
        (payload) => {
          console.log('[ActivityLog] Quality issue:', payload.new);
          const q = payload.new as { issue_type?: string; submitted_by?: string };
          const who = q.submitted_by || 'Someone';
          addActivity(`${who} flagged ${q.issue_type || 'quality issue'}`);
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

  const addActivity = (message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setActivities((prev) => [...prev, { id, message }].slice(-5));

    // Fade out after 6 seconds
    setTimeout(() => {
      setActivities((prev) => prev.filter((a) => a.id !== id));
    }, 6000);
  };

  return (
    <div className="fixed bottom-6 left-6 z-[10005] pointer-events-none flex flex-col-reverse">
      {/* Updates indicator - at the bottom with green light */}
      {isLive && (
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            <span className="text-[9px] font-medium tracking-wider text-white/70 uppercase">Updates</span>
          </div>
        </div>
      )}

      {/* Activity stream - messages appear above the indicator */}
      <div className="space-y-2">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="activity-pill"
          >
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
  );
}
