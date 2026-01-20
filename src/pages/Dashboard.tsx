import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Activity,
  Flag,
} from 'lucide-react';
import { useSessionStore } from '../store/sessionStore';
import { GlassPanel, GlassButton } from '../components/design-system';
import { supabase } from '../lib/supabase';

export function Dashboard() {
  const navigate = useNavigate();
  const { session } = useSessionStore();

  const [decisions, setDecisions] = useState<number>(0);
  const [escalations, setEscalations] = useState<number>(0);
  const [communications, setCommunications] = useState<number>(0);

  useEffect(() => {
    if (!session) {
      navigate('/');
      return;
    }

    // Query real data from Supabase
    const fetchDashboardData = async () => {
      const [decisionsRes, escalationsRes, commsRes] = await Promise.all([
        supabase.from('review_decisions').select('*', { count: 'exact', head: true }).eq('session_code', session.code),
        supabase.from('escalations').select('*', { count: 'exact', head: true }).eq('session_code', session.code),
        supabase.from('communications_log').select('*', { count: 'exact', head: true }).eq('session_code', session.code),
      ]);

      setDecisions(decisionsRes.count || 0);
      setEscalations(escalationsRes.count || 0);
      setCommunications(commsRes.count || 0);
    };

    fetchDashboardData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`dashboard-${session.code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'review_decisions', filter: `session_code=eq.${session.code}` }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'escalations', filter: `session_code=eq.${session.code}` }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'communications_log', filter: `session_code=eq.${session.code}` }, fetchDashboardData)
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [session, navigate]);

  if (!session) return null;

  // Real KPI data from Supabase
  const kpis = [
    {
      label: 'Decisions Made',
      value: String(decisions),
      change: decisions > 0 ? `${decisions} total` : 'None yet',
      icon: FileText,
      gradient: 'from-bmf-blue to-bmf-blue-dark',
      glow: 'shadow-[0_4px_20px_rgba(37,150,190,0.3)]',
    },
    {
      label: 'Escalations',
      value: String(escalations),
      change: escalations > 0 ? 'Active' : 'None',
      icon: AlertTriangle,
      gradient: 'from-red-500 to-rose-600',
      glow: 'shadow-[0_4px_20px_rgba(239,68,68,0.3)]',
    },
    {
      label: 'Communications Sent',
      value: String(communications),
      change: communications > 0 ? 'Recent' : 'None',
      icon: Activity,
      gradient: 'from-blue-500 to-cyan-600',
      glow: 'shadow-[0_4px_20px_rgba(59,130,246,0.3)]',
    },
    {
      label: 'System Status',
      value: 'Active',
      change: 'Online',
      icon: CheckCircle,
      gradient: 'from-emerald-500 to-emerald-600',
      glow: 'shadow-[0_4px_20px_rgba(16,185,129,0.3)]',
    },
  ];

  // Demo review items
  const reviewItems = [
    {
      id: 1,
      type: 'BOL',
      source: 'Outlook',
      issue: 'Weight discrepancy detected',
      confidence: 72,
      time: '5 min ago',
    },
    {
      id: 2,
      type: 'Training',
      source: 'Paper Scan',
      issue: 'Signature unclear',
      confidence: 58,
      time: '12 min ago',
    },
    {
      id: 3,
      type: 'Incident',
      source: 'Outlook',
      issue: 'Location field incomplete',
      confidence: 65,
      time: '28 min ago',
    },
  ];

  // Demo flags
  const activeFlags = [
    {
      id: 1,
      severity: 'high',
      type: 'Equipment',
      location: 'Z2-R08',
      description: 'HVAC unit failure - temperature rising',
      reported: '2 hours ago',
    },
  ];

  return (
    <div className="min-h-screen gradient-bg-animated">
      {/* Header */}
      <header className="glass-panel-heavy border-0 border-b border-white/20 rounded-none px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => navigate('/flowchart')}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </GlassButton>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-ai-purple" />
                Session: <span className="font-mono">{session.code}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm">
              <Activity className="w-4 h-4" />
              <span className="font-medium">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {kpis.map((kpi) => (
            <GlassPanel key={kpi.label} variant="heavy" className={`p-5 ${kpi.glow}`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${kpi.gradient}`}>
                  <kpi.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {kpi.change}
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">{kpi.value}</div>
              <span className="text-sm text-gray-600">{kpi.label}</span>
            </GlassPanel>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <GlassPanel variant="heavy" className="p-6 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Processing Activity</h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Last 7 days</span>
              </div>
            </div>
            {/* Placeholder chart area */}
            <div className="h-48 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border border-gray-200/50">
              <div className="text-center">
                <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Activity chart will render here</p>
                <p className="text-xs text-gray-400 mt-1">After more data is processed</p>
              </div>
            </div>
          </GlassPanel>

          {/* Confidence Distribution */}
          <GlassPanel variant="heavy" className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">AI Confidence</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">High (80%+)</span>
                  <span className="font-medium text-emerald-600">72%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full w-[72%] bg-emerald-500 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Medium (50-80%)</span>
                  <span className="font-medium text-amber-600">20%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full w-[20%] bg-amber-500 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Low (&lt;50%)</span>
                  <span className="font-medium text-red-600">8%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full w-[8%] bg-red-500 rounded-full" />
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200/50">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Sparkles className="w-4 h-4 text-ai-purple" />
                <span>Avg. confidence: <strong className="text-gray-800">84%</strong></span>
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Two column layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Review Queue */}
          <GlassPanel variant="heavy" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Review Queue</h2>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                {reviewItems.length} pending
              </span>
            </div>

            {reviewItems.length > 0 ? (
              <div className="space-y-3">
                {reviewItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-white/60 border border-gray-200/50 hover:bg-white/80 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                            {item.type}
                          </span>
                          <span className="text-xs text-gray-500">via {item.source}</span>
                        </div>
                        <p className="text-sm text-gray-800">{item.issue}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div
                          className={`text-sm font-semibold ${
                            item.confidence >= 70
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }`}
                        >
                          {item.confidence}%
                        </div>
                        <div className="text-xs text-gray-400">{item.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No items need review</p>
                <p className="text-sm mt-1">Process some data to see items here</p>
              </div>
            )}
          </GlassPanel>

          {/* Active Flags */}
          <GlassPanel variant="heavy" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Active Flags</h2>
              {activeFlags.length > 0 && (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">
                  {activeFlags.length} active
                </span>
              )}
            </div>

            {activeFlags.length > 0 ? (
              <div className="space-y-3">
                {activeFlags.map((flag) => (
                  <div
                    key={flag.id}
                    className={`p-3 rounded-xl border ${
                      flag.severity === 'high'
                        ? 'bg-red-50/80 border-red-200'
                        : 'bg-amber-50/80 border-amber-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          flag.severity === 'high' ? 'bg-red-100' : 'bg-amber-100'
                        }`}
                      >
                        <Flag
                          className={`w-4 h-4 ${
                            flag.severity === 'high' ? 'text-red-600' : 'text-amber-600'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-white/60 text-gray-700">
                            {flag.type}
                          </span>
                          <span className="text-xs text-gray-500">{flag.location}</span>
                        </div>
                        <p className="text-sm text-gray-800">{flag.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{flag.reported}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No active flags</p>
                <p className="text-sm mt-1">Flags appear when issues are detected</p>
              </div>
            )}
          </GlassPanel>
        </div>

        {/* Preset Queries */}
        <GlassPanel variant="heavy" className="mt-6 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Queries</h2>
          <div className="flex flex-wrap gap-2">
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
              <GlassButton key={query} variant="ghost" size="sm">
                {query}
              </GlassButton>
            ))}
          </div>
        </GlassPanel>
      </main>
    </div>
  );
}
