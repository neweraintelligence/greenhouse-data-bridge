import { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle2, XCircle, Send, RotateCcw, Trophy, AlertCircle, Loader2, Package, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BillingChallengeProps {
  sessionCode: string;
  participantName: string;
  onComplete: (result: { isCorrect: boolean; timeTaken: number; rank?: number }) => void;
}

interface PalletScan {
  palletId: string;
  quantity: number;
}

interface ChallengeData {
  orderId: string;
  product: string;
  orderedQty: number;
  palletScans: PalletScan[];
  actualTotal: number;
  difference: number; // positive = over, negative = short
}

const ANSWER_OPTIONS = [
  { value: 'match', label: 'Exact Match', description: 'Received exactly what was ordered' },
  { value: 'short_small', label: 'Short (1-10 units)', description: 'Received slightly less' },
  { value: 'short_medium', label: 'Short (11-25 units)', description: 'Received moderately less' },
  { value: 'short_large', label: 'Short (26+ units)', description: 'Received significantly less' },
  { value: 'over', label: 'Over (received more)', description: 'Received more than ordered' },
];

// Generate challenging but realistic pallet quantities
function generatePalletScans(targetTotal: number, numPallets: number): PalletScan[] {
  const scans: PalletScan[] = [];
  let remaining = targetTotal;

  for (let i = 0; i < numPallets - 1; i++) {
    // Generate irregular quantities (not round numbers)
    const avgPerPallet = remaining / (numPallets - i);
    const variance = Math.floor(avgPerPallet * 0.4); // 40% variance
    const qty = Math.floor(avgPerPallet + (Math.random() - 0.5) * 2 * variance);
    const finalQty = Math.max(20, Math.min(qty, remaining - 20)); // Keep at least 20 for last pallet

    scans.push({
      palletId: `PLT-${String(i + 1).padStart(3, '0')}`,
      quantity: finalQty,
    });
    remaining -= finalQty;
  }

  // Last pallet gets the remainder
  scans.push({
    palletId: `PLT-${String(numPallets).padStart(3, '0')}`,
    quantity: remaining,
  });

  // Shuffle the order
  return scans.sort(() => Math.random() - 0.5);
}

// Generate a challenge with intentional discrepancy
function generateChallenge(): ChallengeData {
  const products = [
    'Organic Tomato Seeds (1kg bags)',
    'LED Grow Lights (600W)',
    'Nutrient Solution (5L containers)',
    'Seedling Trays (72-cell)',
    'Grow Medium Bags (50L)',
  ];

  const orderedQty = Math.floor(Math.random() * 200) + 400; // 400-600 range
  const numPallets = Math.floor(Math.random() * 3) + 4; // 4-6 pallets

  // Decide on discrepancy: 70% chance of shortage, 20% exact, 10% over
  const rand = Math.random();
  let difference: number;
  if (rand < 0.7) {
    // Short by 3-20 units
    difference = -(Math.floor(Math.random() * 18) + 3);
  } else if (rand < 0.9) {
    // Exact match
    difference = 0;
  } else {
    // Over by 2-10 units
    difference = Math.floor(Math.random() * 9) + 2;
  }

  const actualTotal = orderedQty + difference;
  const palletScans = generatePalletScans(actualTotal, numPallets);

  return {
    orderId: `PO-2024-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    product: products[Math.floor(Math.random() * products.length)],
    orderedQty,
    palletScans,
    actualTotal,
    difference,
  };
}

function getCorrectAnswer(difference: number): string {
  if (difference === 0) return 'match';
  if (difference > 0) return 'over';
  if (difference >= -10) return 'short_small';
  if (difference >= -25) return 'short_medium';
  return 'short_large';
}

export function BillingChallenge({ sessionCode, participantName, onComplete }: BillingChallengeProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    actualTotal: number;
    difference: number;
    timeTaken: number;
    rank?: number;
    correctAnswer: string;
  } | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate challenge on mount
  useEffect(() => {
    const newChallenge = generateChallenge();
    setChallenge(newChallenge);

    // Start timer
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 100) / 10);
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSubmit = async () => {
    if (!selectedAnswer || !challenge) return;

    setIsSubmitting(true);
    const timeTaken = Date.now() - startTimeRef.current;

    // Stop timer
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const correctAnswer = getCorrectAnswer(challenge.difference);
      const isCorrect = selectedAnswer === correctAnswer;

      // Save response to database
      const { data: responseData, error: insertError } = await supabase
        .from('billing_challenge_responses')
        .insert({
          session_code: sessionCode,
          participant_name: participantName,
          answer: selectedAnswer,
          is_correct: isCorrect,
          time_taken_ms: timeTaken,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Calculate rank
      let rank: number | undefined;
      if (isCorrect) {
        const { count } = await supabase
          .from('billing_challenge_responses')
          .select('*', { count: 'exact', head: true })
          .eq('session_code', sessionCode)
          .eq('is_correct', true)
          .lt('submitted_at', responseData.submitted_at);

        rank = (count || 0) + 1;

        await supabase
          .from('billing_challenge_responses')
          .update({ rank })
          .eq('id', responseData.id);
      }

      setResult({
        isCorrect,
        actualTotal: challenge.actualTotal,
        difference: challenge.difference,
        timeTaken: timeTaken / 1000,
        rank,
        correctAnswer,
      });

      onComplete({ isCorrect, timeTaken, rank });

    } catch (err) {
      console.error('Submit error:', err);
      const correctAnswer = getCorrectAnswer(challenge.difference);
      setResult({
        isCorrect: selectedAnswer === correctAnswer,
        actualTotal: challenge.actualTotal,
        difference: challenge.difference,
        timeTaken: timeTaken / 1000,
        correctAnswer,
      });
      onComplete({ isCorrect: selectedAnswer === correctAnswer, timeTaken });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!challenge) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-bmf-blue animate-spin" />
      </div>
    );
  }

  // Result screen
  if (result) {
    return (
      <div className="space-y-4">
        {/* Result header */}
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
            result.isCorrect ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {result.isCorrect ? (
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600" />
            )}
          </div>
          <h3 className={`text-lg font-bold mt-2 ${result.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {result.isCorrect ? 'Correct!' : 'Not Quite!'}
          </h3>
          <p className="text-gray-500 text-sm">
            Time: <span className="font-mono font-bold">{result.timeTaken.toFixed(1)}s</span>
          </p>
        </div>

        {result.rank && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-1" />
            <p className="text-amber-800 font-bold">#{result.rank} Place!</p>
          </div>
        )}

        {/* AI Analysis */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">AI Reconciliation (instant)</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Ordered:</span>
              <span className="font-mono font-bold">{challenge.orderedQty} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Received:</span>
              <span className="font-mono font-bold">{result.actualTotal} units</span>
            </div>
            <div className="border-t border-blue-200 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Discrepancy:</span>
                <span className={`font-mono font-bold ${
                  result.difference === 0 ? 'text-green-600' :
                  result.difference < 0 ? 'text-red-600' : 'text-amber-600'
                }`}>
                  {result.difference === 0 ? 'None (exact match)' :
                   result.difference > 0 ? `+${result.difference} (over)` :
                   `${result.difference} (short)`}
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-gray-500 mb-2">Pallet breakdown:</p>
            <div className="flex flex-wrap gap-1">
              {challenge.palletScans.map((scan, i) => (
                <span key={i} className="px-2 py-0.5 bg-white rounded text-xs font-mono">
                  {scan.quantity}
                </span>
              ))}
              <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs font-mono">
                = {result.actualTotal}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Check the main screen for the full leaderboard!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Timer - prominent */}
      <div className="flex items-center justify-center gap-2 py-2 px-4 bg-gray-900 text-white rounded-full mx-auto w-fit">
        <Clock className="w-4 h-4" />
        <span className="font-mono text-xl font-bold">{elapsedTime.toFixed(1)}s</span>
      </div>

      {/* Order info */}
      <div className="bg-blue-600 text-white rounded-xl p-3">
        <p className="text-xs opacity-80 uppercase tracking-wide">Purchase Order</p>
        <p className="font-mono text-sm">{challenge.orderId}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold">{challenge.orderedQty}</span>
          <span className="text-sm opacity-80">units ordered</span>
        </div>
        <p className="text-xs mt-1 opacity-70">{challenge.product}</p>
      </div>

      {/* Pallet scans */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Scanned Pallets</span>
          <span className="text-xs text-gray-400">({challenge.palletScans.length} pallets)</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {challenge.palletScans.map((scan, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-gray-400 uppercase">{scan.palletId}</p>
              <p className="text-lg font-bold font-mono text-gray-800">{scan.quantity}</p>
            </div>
          ))}
        </div>

        <div className="mt-2 pt-2 border-t border-dashed border-gray-200 text-center">
          <p className="text-xs text-gray-400">Add them up! Does it match the order?</p>
        </div>
      </div>

      {/* Answer options - compact */}
      <div className="space-y-1.5">
        {ANSWER_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelectedAnswer(option.value)}
            className={`w-full p-2.5 rounded-xl border-2 text-left transition-all ${
              selectedAnswer === option.value
                ? 'border-bmf-blue bg-bmf-blue/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className={`text-sm font-semibold ${
              selectedAnswer === option.value ? 'text-bmf-blue' : 'text-gray-800'
            }`}>
              {option.label}
            </p>
          </button>
        ))}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!selectedAnswer || isSubmitting}
        className="w-full py-3 px-4 rounded-xl bg-bmf-blue text-white font-semibold hover:bg-bmf-blue-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        {isSubmitting ? (
          <>
            <RotateCcw className="w-5 h-5 animate-spin" />
            Checking...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Submit Answer
          </>
        )}
      </button>
    </div>
  );
}
