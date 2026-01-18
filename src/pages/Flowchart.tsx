import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Presentation } from 'lucide-react';
import { useSessionStore } from '../store/sessionStore';
import { FlowCanvas } from '../components/flowchart/FlowCanvas';

export function Flowchart() {
  const navigate = useNavigate();
  const { session, clearSession } = useSessionStore();
  const [startPresentation, setStartPresentation] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate('/');
    }
  }, [session, navigate]);

  const handleLogout = () => {
    clearSession();
    navigate('/');
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-stone-100">
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
              <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-body)' }}>
                {session.name} · {session.code}
              </p>
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
