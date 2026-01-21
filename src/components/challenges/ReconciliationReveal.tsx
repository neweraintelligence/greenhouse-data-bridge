import { useState, useEffect } from 'react';
import { X, Clock, Users, CheckCircle2, AlertCircle } from 'lucide-react';
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

const SAMPLE_DISCREPANCIES: Discrepancy[] = [
  {
    type: 'quantity',
    severity: 'high',
    description: 'Quantity mismatch on PO-2024-4521',
    details: 'Ordered 500 units, received 487 (-13 units)',
  },
  {
    type: 'price',
    severity: 'medium',
    description: 'Unit price variance on INV-58392',
    details: 'Listed $12.75/unit vs $12.47/unit calculated',
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
    details: 'Order #4892 - ACK sent 3 days after receipt',
  },
  {
    type: 'quantity',
    severity: 'medium',
    description: 'Pallet count discrepancy',
    details: 'BOL shows 6 pallets, scan log shows 5',
  },
];

export function ReconciliationReveal({ sessionCode, onClose }: ReconciliationRevealProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [challengeResults, setChallengeResults] = useState<ChallengeResult[]>([]);
  const [aiProcessingTime, setAiProcessingTime] = useState(0);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);

  useEffect(() => {
    fetchSessionData();
  }, [sessionCode]);

  const fetchSessionData = async () => {
    try {
      const processingTime = 0.15 + Math.random() * 0.2;
      setAiProcessingTime(processingTime);

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

  // Top human performer (correct answers only, sorted by time)
  const topHuman = correctResponses.sort((a, b) => a.time_taken_ms - b.time_taken_ms)[0];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-xl w-[480px] overflow-hidden">
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Analyzing data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xl w-[480px] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">AI Analysis Summary</h2>
          <p className="text-xs text-gray-500">{totalRecords} records processed</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Processing Stats */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">AI Processing Time</span>
          </div>
          <span className="text-lg font-mono font-semibold text-gray-900">{aiProcessingTime.toFixed(2)}s</span>
        </div>

        {/* Discrepancies */}
        {discrepancies.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">
                {discrepancies.length} Discrepancies Found
              </span>
            </div>
            <div className="space-y-1.5">
              {discrepancies.slice(0, 3).map((d, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 text-sm"
                >
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    d.severity === 'high' ? 'bg-red-500' :
                    d.severity === 'medium' ? 'bg-amber-500' :
                    'bg-gray-400'
                  }`} />
                  <div>
                    <p className="text-gray-800">{d.description}</p>
                    <p className="text-xs text-gray-500">{d.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Human vs AI Comparison */}
        {challengeResults.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Human vs AI</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-500 mb-1">Avg Human Time</p>
                <p className="text-lg font-mono font-semibold text-gray-900">{avgHumanTime.toFixed(1)}s</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-500 mb-1">AI Time</p>
                <p className="text-lg font-mono font-semibold text-gray-900">{aiProcessingTime.toFixed(2)}s</p>
              </div>
            </div>

            <div className="mt-3 p-3 bg-blue-50 rounded-lg text-center">
              <p className="text-sm text-blue-800">
                AI is <span className="font-semibold">{Math.round(avgHumanTime / aiProcessingTime)}x faster</span> than manual reconciliation
              </p>
            </div>
          </div>
        )}

        {/* Winner Celebration */}
        {topHuman && (
          <div className="border-t border-gray-100 pt-4">
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg text-center relative overflow-hidden">
              {/* Subtle confetti effect */}
              <div className="absolute inset-0 opacity-30 pointer-events-none">
                <span className="absolute top-2 left-4 text-lg">&#127881;</span>
                <span className="absolute top-3 right-6 text-sm">&#10024;</span>
                <span className="absolute bottom-3 left-8 text-sm">&#127942;</span>
                <span className="absolute bottom-2 right-4 text-lg">&#127881;</span>
              </div>

              <div className="relative">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-lg">&#127942;</span>
                  <span className="text-xs font-medium text-amber-700 uppercase tracking-wide">Fastest Human</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{topHuman.participant_name}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-sm text-gray-600 font-mono">{(topHuman.time_taken_ms / 1000).toFixed(1)}s</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
