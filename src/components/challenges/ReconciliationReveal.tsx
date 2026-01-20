import { useState, useEffect } from 'react';
import { Trophy, Zap, AlertTriangle, Clock, Users, CheckCircle2, XCircle, Sparkles, Medal, Bot, Crown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ReconciliationRevealProps {
  sessionCode: string;
  onClose?: () => void;
}

interface SessionStats {
  shipments: number;
  orders: number;
  scans: number;
  trainingRecords: number;
  incidents: number;
  communications: number;
  challengeResponses: number;
}

interface ChallengeResult {
  participant_name: string;
  is_correct: boolean;
  time_taken_ms: number;
  rank: number | null;
}

interface Discrepancy {
  type: 'quantity' | 'price' | 'missing' | 'timing';
  severity: 'high' | 'medium' | 'low';
  description: string;
  details: string;
}

// Simulated discrepancies that AI "found" - in production these would come from actual analysis
const SAMPLE_DISCREPANCIES: Discrepancy[] = [
  {
    type: 'quantity',
    severity: 'high',
    description: 'Quantity mismatch on PO-2024-4521',
    details: 'Ordered 500 units, received 487 (-13 units, $847 variance)',
  },
  {
    type: 'price',
    severity: 'medium',
    description: 'Unit price variance on INV-58392',
    details: 'Listed $12.75/unit, calculated $12.47/unit (+$47.82 overcharge)',
  },
  {
    type: 'missing',
    severity: 'high',
    description: 'Missing receiving signature',
    details: 'SHP-0012 delivered but no sign-off recorded',
  },
  {
    type: 'timing',
    severity: 'low',
    description: 'Order acknowledgment delayed',
    details: 'Customer order #4892 - ACK sent 3 days after receipt',
  },
  {
    type: 'quantity',
    severity: 'medium',
    description: 'Pallet count discrepancy',
    details: 'BOL shows 6 pallets, scan log shows 5 pallets received',
  },
];

export function ReconciliationReveal({ sessionCode, onClose }: ReconciliationRevealProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [challengeResults, setChallengeResults] = useState<ChallengeResult[]>([]);
  const [showPhase, setShowPhase] = useState(0); // Animation phases
  const [aiProcessingTime, setAiProcessingTime] = useState(0);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);

  useEffect(() => {
    fetchSessionData();
  }, [sessionCode]);

  // Animate through phases
  useEffect(() => {
    if (!isLoading && showPhase < 4) {
      const timer = setTimeout(() => {
        setShowPhase((prev) => prev + 1);
      }, showPhase === 0 ? 500 : 800);
      return () => clearTimeout(timer);
    }
  }, [isLoading, showPhase]);

  const fetchSessionData = async () => {
    try {
      // Simulate AI processing time (random between 0.15 and 0.35 seconds)
      const processingTime = 0.15 + Math.random() * 0.2;
      setAiProcessingTime(processingTime);

      // Fetch all session data counts in parallel
      const [
        shipmentsRes,
        ordersRes,
        scansRes,
        trainingRes,
        incidentsRes,
        commsRes,
        challengeRes,
      ] = await Promise.all([
        supabase.from('shipments_expected').select('*', { count: 'exact', head: true }).eq('session_code', sessionCode),
        supabase.from('customer_orders').select('*', { count: 'exact', head: true }).eq('session_code', sessionCode),
        supabase.from('barcode_scans').select('*', { count: 'exact', head: true }).eq('session_code', sessionCode),
        supabase.from('training_roster').select('*', { count: 'exact', head: true }).eq('session_code', sessionCode),
        supabase.from('incidents').select('*', { count: 'exact', head: true }).eq('session_code', sessionCode),
        supabase.from('communications_log').select('*', { count: 'exact', head: true }).eq('session_code', sessionCode),
        supabase.from('billing_challenge_responses').select('*').eq('session_code', sessionCode).order('time_taken_ms', { ascending: true }),
      ]);

      setStats({
        shipments: shipmentsRes.count || 0,
        orders: ordersRes.count || 0,
        scans: scansRes.count || 0,
        trainingRecords: trainingRes.count || 0,
        incidents: incidentsRes.count || 0,
        communications: commsRes.count || 0,
        challengeResponses: challengeRes.data?.length || 0,
      });

      setChallengeResults(challengeRes.data || []);

      // Pick random discrepancies based on data volume
      const totalRecords = (shipmentsRes.count || 0) + (ordersRes.count || 0) + (scansRes.count || 0);
      const numDiscrepancies = Math.min(Math.max(2, Math.floor(totalRecords / 3)), 5);
      const shuffled = [...SAMPLE_DISCREPANCIES].sort(() => Math.random() - 0.5);
      setDiscrepancies(shuffled.slice(0, numDiscrepancies));

    } catch (err) {
      console.error('Error fetching session data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalRecords = stats
    ? stats.shipments + stats.orders + stats.scans + stats.trainingRecords + stats.incidents + stats.communications + stats.challengeResponses
    : 0;

  const correctResponses = challengeResults.filter((r) => r.is_correct);
  const avgHumanTime = challengeResults.length > 0
    ? challengeResults.reduce((sum, r) => sum + r.time_taken_ms, 0) / challengeResults.length / 1000
    : 0;
  const accuracyRate = challengeResults.length > 0
    ? (correctResponses.length / challengeResults.length) * 100
    : 0;

  // Top 3 human performers (correct answers only, sorted by time)
  const topHumans = correctResponses
    .sort((a, b) => a.time_taken_ms - b.time_taken_ms)
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">AI Reconciliation Engine</h2>
              <p className="text-indigo-200">Processing session data...</p>
            </div>
          </div>
        </div>
        <div className="p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4 animate-spin">
              <Zap className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-gray-500">Analyzing all session data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">AI Reconciliation Complete</h2>
              <p className="text-indigo-200">Full audit of session data</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono font-bold text-white">{aiProcessingTime.toFixed(2)}s</div>
            <p className="text-indigo-200 text-sm">Total processing time</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Phase 1: Data Processed */}
        <div className={`transition-all duration-500 ${showPhase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-800">Data Processed</h3>
            <span className="text-sm text-gray-500">({totalRecords} records in {aiProcessingTime.toFixed(2)}s)</span>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Shipments', value: stats?.shipments || 0, icon: '📦' },
              { label: 'Orders', value: stats?.orders || 0, icon: '🛒' },
              { label: 'Scans', value: stats?.scans || 0, icon: '📱' },
              { label: 'Other', value: (stats?.trainingRecords || 0) + (stats?.incidents || 0) + (stats?.communications || 0), icon: '📋' },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-4 text-center">
                <span className="text-2xl">{item.icon}</span>
                <p className="text-2xl font-bold text-gray-800 mt-1">{item.value}</p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Phase 2: Discrepancies Found */}
        <div className={`transition-all duration-500 ${showPhase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-800">Discrepancies Identified</h3>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
              {discrepancies.length} found
            </span>
          </div>

          <div className="space-y-2 mb-8">
            {discrepancies.map((d, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  d.severity === 'high' ? 'bg-red-50 border-red-200' :
                  d.severity === 'medium' ? 'bg-amber-50 border-amber-200' :
                  'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  d.severity === 'high' ? 'bg-red-500' :
                  d.severity === 'medium' ? 'bg-amber-500' :
                  'bg-gray-400'
                }`} />
                <div>
                  <p className="font-medium text-gray-800">{d.description}</p>
                  <p className="text-sm text-gray-500">{d.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase 3: The Leaderboard - AI is #1! */}
        <div className={`transition-all duration-500 ${showPhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-800">Reconciliation Leaderboard</h3>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 mb-8">
            {/* First Place - AI */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-400/20 to-yellow-400/20 rounded-xl border border-amber-400/30 mb-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <Crown className="w-6 h-6 text-amber-400 absolute -top-2 -right-1 drop-shadow-lg" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold text-lg">#1</span>
                  <span className="text-white font-bold text-xl">AI Reconciliation Engine</span>
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-gray-400 text-sm">Processed {totalRecords} records, found {discrepancies.length} discrepancies</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-mono font-bold text-amber-400">{aiProcessingTime.toFixed(2)}s</p>
                <p className="text-xs text-gray-500">100% accuracy</p>
              </div>
            </div>

            {/* Human Podium */}
            {topHumans.length > 0 ? (
              <div className="space-y-2">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Human Competitors
                </p>
                {topHumans.map((human, idx) => (
                  <div
                    key={human.participant_name}
                    className={`flex items-center gap-4 p-3 rounded-xl ${
                      idx === 0 ? 'bg-gray-700/50' : 'bg-gray-800/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      idx === 0 ? 'bg-gray-400 text-gray-900' :
                      idx === 1 ? 'bg-amber-700 text-amber-100' :
                      'bg-amber-900 text-amber-200'
                    }`}>
                      {idx === 0 ? <Medal className="w-5 h-5" /> : <span className="font-bold">#{idx + 2}</span>}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{human.participant_name}</p>
                      <p className="text-gray-500 text-xs">
                        {idx === 0 ? '🥈 Best Human' : idx === 1 ? '🥉 Runner Up' : 'Honorable Mention'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-mono text-gray-300">{(human.time_taken_ms / 1000).toFixed(1)}s</p>
                      <p className="text-xs text-gray-500">
                        {Math.round((human.time_taken_ms / 1000) / aiProcessingTime)}x slower than AI
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : challengeResults.length > 0 ? (
              <div className="text-center py-4 text-gray-500">
                <XCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No correct human answers yet!</p>
                <p className="text-sm text-gray-600">AI remains undefeated 🤖</p>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No challenge participants yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Phase 4: The Punchline */}
        <div className={`transition-all duration-500 ${showPhase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">The Bottom Line</h4>
                {challengeResults.length > 0 ? (
                  <>
                    <p className="text-gray-700 mb-3">
                      Your team averaged <span className="font-bold text-blue-600">{avgHumanTime.toFixed(1)} seconds</span> per reconciliation
                      with <span className="font-bold text-blue-600">{accuracyRate.toFixed(0)}% accuracy</span>.
                    </p>
                    <p className="text-gray-700 mb-3">
                      AI processed <span className="font-bold">{totalRecords} records</span> and found{' '}
                      <span className="font-bold">{discrepancies.length} discrepancies</span> in{' '}
                      <span className="font-bold text-blue-600">{aiProcessingTime.toFixed(2)} seconds</span> with{' '}
                      <span className="font-bold text-blue-600">100% accuracy</span>.
                    </p>
                    <div className="mt-4 p-4 bg-white rounded-xl border border-blue-200">
                      <p className="text-xl font-bold text-center text-gray-800">
                        AI is <span className="text-blue-600">{Math.round(avgHumanTime / aiProcessingTime)}x faster</span> than manual reconciliation
                      </p>
                      <p className="text-center text-gray-500 text-sm mt-1">
                        Time is money. How much are manual errors costing you?
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-700">
                    AI processed <span className="font-bold">{totalRecords} records</span> in{' '}
                    <span className="font-bold text-blue-600">{aiProcessingTime.toFixed(2)} seconds</span>.
                    Manual reconciliation would take hours.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
