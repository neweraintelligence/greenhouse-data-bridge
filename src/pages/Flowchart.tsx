import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, ArrowLeft, Sparkles, Truck, GraduationCap, AlertTriangle } from 'lucide-react';
import { useSessionStore } from '../store/sessionStore';
import { getAllUseCases } from '../lib/useCases/registry';
import { FlowCanvas } from '../components/flowchart/FlowCanvas';
import { GlassPanel, GlassButton } from '../components/design-system';
import type { UseCase } from '../lib/useCases/types';

const useCaseIcons: Record<string, typeof Truck> = {
  shipping: Truck,
  training: GraduationCap,
  incidents: AlertTriangle,
};

const useCaseGradients: Record<string, string> = {
  shipping: 'from-bmf-blue to-bmf-blue-dark',
  training: 'from-emerald-500 to-emerald-600',
  incidents: 'from-amber-500 to-orange-500',
};

export function Flowchart() {
  const navigate = useNavigate();
  const { session, clearSession } = useSessionStore();
  const useCases = getAllUseCases();
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase | null>(null);

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

  // Use case selection view
  if (!selectedUseCase) {
    return (
      <div className="min-h-screen gradient-bg-animated">
        {/* Header */}
        <header className="glass-panel-heavy border-0 border-b border-white/20 rounded-none px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/bmf-logo.png"
                alt="Big Marble Farms"
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-800">
                  Greenhouse Data Bridge
                </h1>
                <p className="text-sm text-gray-500 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-ai-purple" />
                  Welcome, {session.name} · <span className="font-mono">{session.code}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                icon={<LayoutDashboard className="w-4 h-4" />}
              >
                Dashboard
              </GlassButton>
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                icon={<LogOut className="w-4 h-4" />}
              >
                Exit
              </GlassButton>
            </div>
          </div>
        </header>

        {/* Main content - Use case selection */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">Choose a Use Case</h2>
            <p className="text-white/80">
              Select a workflow to begin processing data
            </p>
          </div>

          {/* Use case cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map((useCase) => {
              const Icon = useCaseIcons[useCase.id] || AlertTriangle;
              const gradient = useCaseGradients[useCase.id] || 'from-gray-500 to-gray-600';

              return (
                <GlassPanel
                  key={useCase.id}
                  variant="heavy"
                  hover
                  onClick={() => setSelectedUseCase(useCase)}
                  className="p-6 cursor-pointer hover:shadow-[0_8px_40px_rgba(37,150,190,0.25)] transition-all duration-300"
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${gradient} shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {useCase.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {useCase.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {useCase.sources.filter(s => !s.optional).length} sources
                    </span>
                    <span className="text-gray-500">
                      {useCase.outputTemplates.length} outputs
                    </span>
                  </div>
                </GlassPanel>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  // Flowchart view for selected use case
  const UseCaseIcon = useCaseIcons[selectedUseCase.id] || AlertTriangle;
  const useCaseGradient = useCaseGradients[selectedUseCase.id] || 'from-gray-500 to-gray-600';

  return (
    <div className="min-h-screen gradient-bg-animated">
      {/* Header */}
      <header className="glass-panel-heavy border-0 border-b border-white/20 rounded-none px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUseCase(null)}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </GlassButton>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${useCaseGradient}`}>
              <UseCaseIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                {selectedUseCase.name}
              </h1>
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-ai-purple" />
                Session: <span className="font-mono">{session.code}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              icon={<LayoutDashboard className="w-4 h-4" />}
            >
              Dashboard
            </GlassButton>
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              icon={<LogOut className="w-4 h-4" />}
            >
              Exit
            </GlassButton>
          </div>
        </div>
      </header>

      {/* Main content - Flowchart */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Instructions */}
        <GlassPanel variant="light" className="mb-6 p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-bmf-blue/10">
              <Sparkles className="w-5 h-5 text-bmf-blue" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">How it works</h3>
              <p className="text-sm text-gray-600">
                1. Click each source node to fetch data → 2. Watch items arrive in the Intake Folder →
                3. Click "Process" when ready → 4. Download your AI-generated outputs
              </p>
            </div>
          </div>
        </GlassPanel>

        {/* Flow Canvas */}
        <FlowCanvas
          useCase={selectedUseCase}
          sessionCode={session.code}
          onProcessComplete={(stats) => {
            console.log('Processing complete:', stats);
          }}
        />

        {/* Use case info */}
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <GlassPanel variant="heavy" className="p-5">
            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-bmf-blue" />
              Data Sources
            </h4>
            <ul className="text-sm text-gray-600 space-y-2">
              {selectedUseCase.sources.map((s) => (
                <li key={s.name} className="flex items-center justify-between">
                  <span className={s.optional ? 'text-gray-400' : 'text-gray-700'}>
                    {s.name}
                  </span>
                  {s.optional ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">optional</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-bmf-blue/10 text-bmf-blue">required</span>
                  )}
                </li>
              ))}
            </ul>
          </GlassPanel>
          <GlassPanel variant="heavy" className="p-5">
            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Expected Outputs
            </h4>
            <ul className="text-sm text-gray-600 space-y-2">
              {selectedUseCase.outputTemplates.map((o) => (
                <li key={o.id} className="flex items-center justify-between">
                  <span className="text-gray-700">{o.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    o.fileType === 'pdf'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {o.fileType.toUpperCase()}
                  </span>
                </li>
              ))}
            </ul>
          </GlassPanel>
        </div>
      </main>
    </div>
  );
}
