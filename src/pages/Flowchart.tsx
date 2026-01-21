import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Presentation, Printer, Copy, Check } from 'lucide-react';
import { useSessionStore } from '../store/sessionStore';
import { FlowCanvas } from '../components/flowchart/FlowCanvas';
import { ScanToast, useScanNotifications } from '../components/ScanToast';
import { supabase } from '../lib/supabase';

export function Flowchart() {
  const navigate = useNavigate();
  const { session, clearSession } = useSessionStore();
  const [startPresentation, setStartPresentation] = useState(false);
  const [copied, setCopied] = useState(false);
  const { notifications, addNotification, dismissNotification } = useScanNotifications();

  useEffect(() => {
    if (!session) {
      navigate('/');
    }
  }, [session, navigate]);

  // Subscribe to barcode scans for toast notifications
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel(`scan-toasts-${session.code}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'barcode_scans',
          filter: `session_code=eq.${session.code}`,
        },
        (payload) => {
          const scan = payload.new as {
            shipment_id: string;
            scanned_by: string;
            sku: string;
            qty_scanned: number;
          };
          addNotification(
            'success',
            scan.shipment_id,
            scan.scanned_by || 'Unknown',
            `Scanned ${scan.qty_scanned} units of ${scan.sku}`
          );
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [session, addNotification]);

  const handleLogout = () => {
    clearSession();
    navigate('/');
  };

  const handleCopySessionCode = async () => {
    if (!session) return;
    await navigator.clipboard.writeText(session.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Toast notifications - highest z-index to appear above modals */}
      <ScanToast notifications={notifications} onDismiss={dismissNotification} />
      {/* Header - clean and minimal */}
      <header className="bg-white/90 backdrop-blur-md border-b border-stone-200 px-8 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left - Logo and title */}
          <div className="flex items-center gap-4">
            <img
              src="/bmf-logo.png"
              alt="Big Marble Farms"
              className="h-9 w-auto"
            />
            <div className="border-l border-stone-300 pl-4">
              <h1 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
                Greenhouse Data Bridge
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-body)' }}>
                  {session.name}
                </p>
                <span className="text-xs text-gray-300">·</span>
                <button
                  onClick={handleCopySessionCode}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-bmf-blue/10 hover:bg-bmf-blue/20 transition-colors group"
                  title="Copy session code"
                >
                  <span className="text-sm font-mono font-bold text-bmf-blue">{session.code}</span>
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-bmf-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right - Actions (minimal icon buttons) */}
          <div className="flex items-center gap-1">
            {/* Present button - primary action */}
            <button
              onClick={() => setStartPresentation(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bmf-blue text-white hover:bg-bmf-blue-dark transition-all text-sm font-medium"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <Presentation className="w-4 h-4" />
              <span>Present</span>
            </button>

            {/* Print Labels - for barcode demo */}
            <button
              onClick={() => window.open(`/print-labels/${session.code}`, '_blank')}
              className="w-9 h-9 rounded-xl hover:bg-stone-100 transition-colors flex items-center justify-center text-stone-600 hover:text-stone-900"
              title="Print QR Labels"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Dashboard - subtle icon button */}
            <button
              onClick={() => navigate('/dashboard')}
              className="w-9 h-9 rounded-xl hover:bg-stone-100 transition-colors flex items-center justify-center text-stone-600 hover:text-stone-900"
              title="Dashboard"
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>

            {/* Exit - subtle icon button */}
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-xl hover:bg-stone-100 transition-colors flex items-center justify-center text-stone-500 hover:text-stone-700"
              title="Exit"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content - Flowchart */}
      <main className="px-4 py-4">
        {/* Flow Canvas - full width */}
        <FlowCanvas
          sessionCode={session.code}
          startPresentationMode={startPresentation}
          onPresentationStart={() => setStartPresentation(false)}
          onProcessComplete={(stats) => {
            console.log('Processing complete:', stats);
          }}
        />
      </main>
    </div>
  );
}
