import { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle2, XCircle, Send, RotateCcw, Trophy, Loader2, Package, Zap, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BillingChallengeProps {
  sessionCode: string;
  participantName: string;
  onComplete: (result: { isCorrect: boolean; timeTaken: number; rank?: number }) => void;
}

interface PalletScan {
  palletId: string;
  quantity: number;
  sku: string;
  isTarget: boolean; // belongs to the target order
}

interface ChallengeData {
  orderId: string;
  product: string;
  sku: string;
  orderedQty: number;
  palletScans: PalletScan[]; // All pallets (mixed orders)
  targetPallets: PalletScan[]; // Only pallets for target order
  actualTotal: number;
  difference: number;
}

const ANSWER_OPTIONS = [
  { value: 'short', label: 'SHORT', emoji: '📉', color: 'border-red-300 bg-red-50 text-red-700' },
  { value: 'match', label: 'MATCH', emoji: '✓', color: 'border-green-300 bg-green-50 text-green-700' },
  { value: 'over', label: 'OVER', emoji: '📈', color: 'border-amber-300 bg-amber-50 text-amber-700' },
];

// Product catalog with SKUs
const PRODUCTS = [
  { name: 'Organic Tomato Seeds (1kg)', sku: 'TOM-ORG-1K' },
  { name: 'LED Grow Lights (600W)', sku: 'LED-600W' },
  { name: 'Nutrient Solution (5L)', sku: 'NUT-5L' },
  { name: 'Seedling Trays (72-cell)', sku: 'TRY-72C' },
  { name: 'Grow Medium Bags (50L)', sku: 'GRW-50L' },
  { name: 'pH Testing Kit', sku: 'PH-KIT-01' },
  { name: 'Irrigation Timer', sku: 'IRR-TMR' },
];

// Generate pallet scans for a given total
function generatePalletsForProduct(
  targetTotal: number,
  numPallets: number,
  sku: string,
  isTarget: boolean,
  startPalletNum: number
): PalletScan[] {
  const scans: PalletScan[] = [];
  let remaining = targetTotal;

  for (let i = 0; i < numPallets - 1; i++) {
    const avgPerPallet = remaining / (numPallets - i);
    const variance = Math.floor(avgPerPallet * 0.4);
    const qty = Math.floor(avgPerPallet + (Math.random() - 0.5) * 2 * variance);
    const finalQty = Math.max(15, Math.min(qty, remaining - 15));

    scans.push({
      palletId: `PLT-${String(startPalletNum + i).padStart(3, '0')}`,
      quantity: finalQty,
      sku,
      isTarget,
    });
    remaining -= finalQty;
  }

  scans.push({
    palletId: `PLT-${String(startPalletNum + numPallets - 1).padStart(3, '0')}`,
    quantity: remaining,
    sku,
    isTarget,
  });

  return scans;
}

// Generate a complex challenge with multiple SKUs mixed together
function generateChallenge(): ChallengeData {
  // Pick target product
  const targetProductIdx = Math.floor(Math.random() * PRODUCTS.length);
  const targetProduct = PRODUCTS[targetProductIdx];

  // Pick 2-3 distractor products
  const distractorCount = Math.floor(Math.random() * 2) + 2; // 2-3 distractors
  const availableProducts = PRODUCTS.filter((_, i) => i !== targetProductIdx);
  const distractors = availableProducts
    .sort(() => Math.random() - 0.5)
    .slice(0, distractorCount);

  // Target order quantities
  const orderedQty = Math.floor(Math.random() * 150) + 350; // 350-500 range
  const targetPalletCount = Math.floor(Math.random() * 2) + 3; // 3-4 pallets

  // Decide on discrepancy: 70% shortage, 20% exact, 10% over
  const rand = Math.random();
  let difference: number;
  if (rand < 0.7) {
    difference = -(Math.floor(Math.random() * 18) + 3); // Short 3-20
  } else if (rand < 0.9) {
    difference = 0;
  } else {
    difference = Math.floor(Math.random() * 9) + 2; // Over 2-10
  }

  const actualTotal = orderedQty + difference;
  const targetPallets = generatePalletsForProduct(actualTotal, targetPalletCount, targetProduct.sku, true, 1);

  // Generate distractor pallets
  let allPallets: PalletScan[] = [...targetPallets];
  let palletNum = targetPalletCount + 1;

  for (const distractor of distractors) {
    const distractorQty = Math.floor(Math.random() * 200) + 150; // 150-350
    const distractorPalletCount = Math.floor(Math.random() * 2) + 2; // 2-3 pallets
    const distractorPallets = generatePalletsForProduct(
      distractorQty,
      distractorPalletCount,
      distractor.sku,
      false,
      palletNum
    );
    allPallets = [...allPallets, ...distractorPallets];
    palletNum += distractorPalletCount;
  }

  // Shuffle all pallets
  allPallets = allPallets.sort(() => Math.random() - 0.5);

  return {
    orderId: `PO-2024-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    product: targetProduct.name,
    sku: targetProduct.sku,
    orderedQty,
    palletScans: allPallets,
    targetPallets,
    actualTotal,
    difference,
  };
}

function getCorrectAnswer(difference: number): string {
  if (difference === 0) return 'match';
  if (difference > 0) return 'over';
  return 'short';
}

// Get background color based on SKU for visual distinction
function getSkuColor(sku: string, isTarget: boolean): string {
  if (isTarget) return 'bg-blue-50 border-blue-200';

  // Hash the SKU to get consistent colors for distractors
  const hash = sku.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    'bg-amber-50 border-amber-200',
    'bg-rose-50 border-rose-200',
    'bg-emerald-50 border-emerald-200',
    'bg-purple-50 border-purple-200',
  ];
  return colors[hash % colors.length];
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
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Target SKU:</span>
              <span className="font-mono font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">{challenge.sku}</span>
            </div>
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

          {/* Breakdown - only target pallets */}
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-gray-500 mb-2">Matching pallets ({challenge.sku}):</p>
            <div className="flex flex-wrap gap-1">
              {challenge.targetPallets.map((scan, i) => (
                <span key={i} className="px-2 py-0.5 bg-blue-100 border border-blue-300 rounded text-xs font-mono">
                  {scan.quantity}
                </span>
              ))}
              <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs font-mono">
                = {result.actualTotal}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              AI filtered {challenge.palletScans.length - challenge.targetPallets.length} pallets from other orders
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Check the main screen for the full leaderboard!
        </p>
      </div>
    );
  }

  // Get unique SKUs for the legend
  const uniqueSkus = [...new Set(challenge.palletScans.map(p => p.sku))];

  return (
    <div className="space-y-3">
      {/* Timer - prominent */}
      <div className="flex items-center justify-center gap-2 py-2 px-4 bg-gray-900 text-white rounded-full mx-auto w-fit">
        <Clock className="w-4 h-4" />
        <span className="font-mono text-xl font-bold">{elapsedTime.toFixed(1)}s</span>
      </div>

      {/* Order info - with SKU highlight */}
      <div className="bg-blue-600 text-white rounded-xl p-3">
        <p className="text-xs opacity-80 uppercase tracking-wide">Purchase Order</p>
        <p className="font-mono text-sm">{challenge.orderId}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold">{challenge.orderedQty}</span>
          <span className="text-sm opacity-80">units ordered</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Filter className="w-3 h-3 opacity-70" />
          <span className="text-xs opacity-70">SKU:</span>
          <span className="font-mono text-sm font-bold bg-white/20 px-2 py-0.5 rounded">{challenge.sku}</span>
        </div>
        <p className="text-xs mt-1 opacity-60">{challenge.product}</p>
      </div>

      {/* SKU Legend */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
        <p className="text-xs text-amber-800 font-medium mb-1.5 flex items-center gap-1">
          <span className="inline-block w-4 h-4 text-center">⚠️</span>
          Mixed shipment! Find pallets matching your SKU
        </p>
        <div className="flex flex-wrap gap-1.5">
          {uniqueSkus.map((sku) => {
            const isTarget = sku === challenge.sku;
            return (
              <span
                key={sku}
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  isTarget
                    ? 'bg-blue-100 border-blue-400 text-blue-700 font-bold'
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                }`}
              >
                {sku} {isTarget && '← yours'}
              </span>
            );
          })}
        </div>
      </div>

      {/* Pallet scans - mixed orders */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Receiving Log</span>
          <span className="text-xs text-gray-400">({challenge.palletScans.length} pallets)</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {challenge.palletScans.map((scan, i) => (
            <div
              key={i}
              className={`rounded-lg p-2 border ${getSkuColor(scan.sku, scan.isTarget)}`}
            >
              <div className="flex justify-between items-start">
                <p className="text-[9px] text-gray-400 uppercase">{scan.palletId}</p>
                <span className={`text-[9px] font-mono px-1 rounded ${
                  scan.isTarget
                    ? 'bg-blue-200 text-blue-700'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {scan.sku}
                </span>
              </div>
              <p className="text-lg font-bold font-mono text-gray-800 text-center mt-1">{scan.quantity}</p>
            </div>
          ))}
        </div>

        <div className="mt-2 pt-2 border-t border-dashed border-gray-200 text-center">
          <p className="text-xs text-gray-400">Filter by SKU, then add up matching pallets!</p>
        </div>
      </div>

      {/* Answer options - large tappable buttons */}
      <div className="grid grid-cols-3 gap-2">
        {ANSWER_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelectedAnswer(option.value)}
            className={`p-4 rounded-xl border-3 text-center transition-all ${
              selectedAnswer === option.value
                ? 'border-bmf-blue ring-2 ring-bmf-blue/30 scale-105'
                : `border-2 ${option.color}`
            }`}
          >
            <span className="text-2xl block mb-1">{option.emoji}</span>
            <span className={`text-sm font-bold ${
              selectedAnswer === option.value ? 'text-bmf-blue' : ''
            }`}>
              {option.label}
            </span>
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
