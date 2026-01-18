import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { useSessionStore } from '../store/sessionStore';
import { getAllUseCases } from '../lib/useCases/registry';
import { FlowCanvas } from '../components/flowchart/FlowCanvas';
import type { UseCase } from '../lib/useCases/types';

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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                Greenhouse Data Bridge
              </h1>
              <p className="text-sm text-gray-500">
                Welcome, {session.name} · Session: <span className="font-mono">{session.code}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Exit
              </button>
            </div>
          </div>
        </header>

        {/* Main content - Use case selection */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose a Use Case</h2>
            <p className="text-gray-600">
              Select a workflow to begin processing data
            </p>
          </div>

          {/* Use case cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map((useCase) => (
              <div
                key={useCase.id}
                onClick={() => setSelectedUseCase(useCase)}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer group"
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-${useCase.color}-100 group-hover:bg-${useCase.color}-200 transition-colors`}>
                  <span className="text-2xl">
                    {useCase.id === 'shipping' && '🚚'}
                    {useCase.id === 'training' && '🎓'}
                    {useCase.id === 'incidents' && '⚠️'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {useCase.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {useCase.description}
                </p>
                <div className="text-sm text-gray-500">
                  {useCase.sources.filter(s => !s.optional).length} required sources · {useCase.outputTemplates.length} outputs
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Flowchart view for selected use case
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedUseCase(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                {selectedUseCase.name}
              </h1>
              <p className="text-sm text-gray-500">
                Session: <span className="font-mono">{session.code}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Exit
            </button>
          </div>
        </div>
      </header>

      {/* Main content - Flowchart */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Instructions */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-1">How it works</h3>
          <p className="text-sm text-blue-700">
            1. Click on each source node to fetch data → 2. Watch items arrive in the Intake Folder →
            3. Click "Process" when all required items are received → 4. Download your outputs
          </p>
        </div>

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
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Data Sources</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {selectedUseCase.sources.map((s) => (
                <li key={s.name} className="flex items-center gap-2">
                  <span className={s.optional ? 'text-gray-400' : 'text-gray-600'}>
                    {s.optional ? '○' : '●'} {s.name}
                  </span>
                  {s.optional && <span className="text-xs text-gray-400">(optional)</span>}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Expected Outputs</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {selectedUseCase.outputTemplates.map((o) => (
                <li key={o.id}>
                  {o.fileType === 'pdf' ? '📄' : '📊'} {o.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
