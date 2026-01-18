import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard } from 'lucide-react';
import { useSessionStore } from '../store/sessionStore';
import { getAllUseCases } from '../lib/useCases/registry';

export function Flowchart() {
  const navigate = useNavigate();
  const { session, clearSession } = useSessionStore();
  const useCases = getAllUseCases();

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

      {/* Main content */}
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
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer group"
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-${useCase.color}-100 group-hover:bg-${useCase.color}-200 transition-colors`}>
                <span className={`text-2xl`}>
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

        {/* Placeholder for React Flow canvas */}
        <div className="mt-12 bg-white rounded-xl border border-gray-200 p-8">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium mb-2">Interactive Flowchart</p>
            <p className="text-sm">
              React Flow canvas will be rendered here showing the data journey:
              <br />
              Sources → Intake Folder → Processing → Outputs
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
