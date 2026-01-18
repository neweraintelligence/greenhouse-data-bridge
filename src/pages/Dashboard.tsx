import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useSessionStore } from '../store/sessionStore';

export function Dashboard() {
  const navigate = useNavigate();
  const { session } = useSessionStore();

  useEffect(() => {
    if (!session) {
      navigate('/');
    }
  }, [session, navigate]);

  if (!session) return null;

  // Placeholder KPI data
  const kpis = [
    { label: 'Items Processed', value: '0', icon: FileText, color: 'blue' },
    { label: 'Needs Review', value: '0', icon: Clock, color: 'yellow' },
    { label: 'Active Flags', value: '0', icon: AlertTriangle, color: 'red' },
    { label: 'Resolved', value: '0', icon: CheckCircle, color: 'green' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/flowchart')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
              <p className="text-sm text-gray-500">
                Session: <span className="font-mono">{session.code}</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-center gap-3 mb-2">
                <kpi.icon className={`w-5 h-5 text-${kpi.color}-500`} />
                <span className="text-sm text-gray-600">{kpi.label}</span>
              </div>
              <div className="text-3xl font-bold text-gray-800">{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Two column layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Review Queue */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Review Queue</h2>
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No items need review</p>
              <p className="text-sm mt-1">Process some data to see items here</p>
            </div>
          </div>

          {/* Active Flags */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Active Flags</h2>
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No active flags</p>
              <p className="text-sm mt-1">Flags appear when issues are detected</p>
            </div>
          </div>
        </div>

        {/* Preset Queries */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Queries</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'Needs Review by Source',
              'Top Incident Types',
              'Hot Zones',
              'High Severity Open',
              'SLA Breaches',
              'Duplicate Documents',
              'Overdue Training',
              'Mismatches by Vendor',
            ].map((query) => (
              <button
                key={query}
                className="px-4 py-2 text-sm text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
