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
          const s = payload.new as { shipment_id: string };
          addActivity(`Shipment ${s.shipment_id} added`);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'training_roster', filter: `session_code=eq.${sessionCode}` },
        (payload) => {
          console.log('[ActivityLog] Training entry:', payload.new);
          const t = payload.new as { name: string };
          addActivity(`${t.name} added to training`);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'incidents', filter: `session_code=eq.${sessionCode}` },
        (payload) => {
          console.log('[ActivityLog] Incident reported:', payload.new);
          const i = payload.new as { incident_type: string };
          addActivity(`Incident: ${i.incident_type}`);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'barcode_scans', filter: `session_code=eq.${sessionCode}` },
        (payload) => {
          console.log('[ActivityLog] Barcode scanned:', payload.new);
          const b = payload.new as { shipment_id: string };
          addActivity(`Scanned ${b.shipment_id}`);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'customer_orders', filter: `session_code=eq.${sessionCode}` },
        (payload) => {
          console.log('[ActivityLog] Customer order:', payload.new);
          const o = payload.new as { customer_name?: string; po_number?: string };
          addActivity(`Order ${o.po_number || 'received'} from ${o.customer_name || 'customer'}`);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'quality_issues', filter: `session_code=eq.${sessionCode}` },
        (payload) => {
          console.log('[ActivityLog] Quality issue:', payload.new);
          const q = payload.new as { issue_type?: string; product_name?: string };
          addActivity(`Quality: ${q.issue_type || 'issue'} on ${q.product_name || 'product'}`);
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
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="text-[10px] font-semibold tracking-wider text-white/90 uppercase">Updates</span>
          </div>
        </div>
      )}

      {/* Activity stream - messages appear above the indicator */}
      <div className="space-y-2">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm animate-in fade-in slide-in-from-left-4 duration-300"
            style={{
              animation: 'fadeInSlide 0.3s ease-out, fadeOut 0.5s ease-in 5.5s forwards',
            }}
          >
            <span className="text-sm text-white font-medium">{activity.message}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
