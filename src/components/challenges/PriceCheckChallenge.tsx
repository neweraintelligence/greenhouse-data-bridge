import { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle2, XCircle, Send, RotateCcw, Trophy, Loader2, DollarSign, Zap, Calculator } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PriceCheckChallengeProps {
  sessionCode: string;
  participantName: string;
  onComplete: (result: { isCorrect: boolean; timeTaken: number; rank?: number }) => void;
}

interface ChallengeData {
  invoiceNumber: string;
  product: string;
  quantity: number;
  invoiceTotal: number;
  claimedUnitPrice: number;
  actualUnitPrice: number;
  isCorrect: boolean; // Whether the claimed unit price is actually correct
  discrepancyAmount: number; // How much the invoice is off by
}

const ANSWER_OPTIONS = [
  { value: 'incorrect_over', label: 'OVER', emoji: '💸', color: 'border-red-300 bg-red-50 text-red-700' },
  { value: 'correct', label: 'CORRECT', emoji: '✓', color: 'border-green-300 bg-green-50 text-green-700' },
  { value: 'incorrect_under', label: 'UNDER', emoji: '🔻', color: 'border-amber-300 bg-amber-50 text-amber-700' },
];

// Products with realistic price ranges
const PRODUCTS = [
  { name: 'Organic Fertilizer (25kg)', basePrice: 47.50 },
  { name: 'Seedling Plugs (144ct)', basePrice: 12.75 },
  { name: 'Drip Irrigation Kit', basePrice: 89.99 },
  { name: 'Plant Labels (500pk)', basePrice: 23.45 },
  { name: 'Potting Soil (40L)', basePrice: 18.95 },
  { name: 'Grow Light Bulbs (4pk)', basePrice: 34.80 },
  { name: 'pH Adjustment Solution', basePrice: 15.60 },
];

// Generate a challenge with intentional pricing discrepancy
function generateChallenge(): ChallengeData {
  const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];

  // Generate quantity (irregular numbers are harder)
  const quantity = Math.floor(Math.random() * 200) + 47; // 47-247 range

  // Vary the actual unit price slightly from base
  const priceVariation = (Math.random() - 0.5) * 10; // +/- $5
  const actualUnitPrice = Math.round((product.basePrice + priceVariation) * 100) / 100;

  // Calculate what the actual total should be
  const actualTotal = Math.round(quantity * actualUnitPrice * 100) / 100;

  // Decide if we create a discrepancy: 60% has error, 40% correct
  const hasError = Math.random() < 0.6;

  let claimedUnitPrice: number;
  let invoiceTotal: number;
  let discrepancyAmount: number;

  if (hasError) {
    // Create a subtle pricing error
    const errorType = Math.random();
    if (errorType < 0.5) {
      // Overcharge: slightly higher unit price
      const overchargePercent = 0.02 + Math.random() * 0.05; // 2-7% overcharge
      claimedUnitPrice = Math.round(actualUnitPrice * (1 + overchargePercent) * 100) / 100;
      invoiceTotal = Math.round(quantity * claimedUnitPrice * 100) / 100;
      discrepancyAmount = invoiceTotal - actualTotal;
    } else {
      // Undercharge: slightly lower unit price
      const underchargePercent = 0.02 + Math.random() * 0.05; // 2-7% undercharge
      claimedUnitPrice = Math.round(actualUnitPrice * (1 - underchargePercent) * 100) / 100;
      invoiceTotal = Math.round(quantity * claimedUnitPrice * 100) / 100;
      discrepancyAmount = invoiceTotal - actualTotal;
    }
  } else {
    // No error - claimed price is actual price
    claimedUnitPrice = actualUnitPrice;
    invoiceTotal = actualTotal;
    discrepancyAmount = 0;
  }

  return {
    invoiceNumber: `INV-${String(Math.floor(Math.random() * 90000) + 10000)}`,
    product: product.name,
    quantity,
    invoiceTotal,
    claimedUnitPrice,
    actualUnitPrice,
    isCorrect: !hasError,
    discrepancyAmount: Math.round(discrepancyAmount * 100) / 100,
  };
}

function getCorrectAnswer(challenge: ChallengeData): string {
  if (challenge.isCorrect) return 'correct';
  return challenge.discrepancyAmount > 0 ? 'incorrect_over' : 'incorrect_under';
}

export function PriceCheckChallenge({ sessionCode, participantName, onComplete }: PriceCheckChallengeProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    challenge: ChallengeData;
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
      const correctAnswer = getCorrectAnswer(challenge);
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
          challenge_type: 'price_check',
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
        challenge,
        timeTaken: timeTaken / 1000,
        rank,
        correctAnswer,
      });

      onComplete({ isCorrect, timeTaken, rank });

    } catch (err) {
      console.error('Submit error:', err);
      const correctAnswer = getCorrectAnswer(challenge);
      setResult({
        isCorrect: selectedAnswer === correctAnswer,
        challenge,
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
    const ch = result.challenge;
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
            <span className="text-sm font-semibold text-blue-800">AI Price Verification (instant)</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Quantity:</span>
              <span className="font-mono font-bold">{ch.quantity} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Invoice Total:</span>
              <span className="font-mono font-bold">${ch.invoiceTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Claimed Unit Price:</span>
              <span className="font-mono font-bold">${ch.claimedUnitPrice.toFixed(2)}</span>
            </div>
            <div className="border-t border-blue-200 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Verification:</span>
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {ch.quantity} × ${ch.claimedUnitPrice.toFixed(2)} = ${(ch.quantity * ch.claimedUnitPrice).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Result:</span>
              <span className={`font-mono font-bold ${
                ch.isCorrect ? 'text-green-600' :
                ch.discrepancyAmount > 0 ? 'text-red-600' : 'text-amber-600'
              }`}>
                {ch.isCorrect ? 'Correct pricing' :
                 ch.discrepancyAmount > 0 ? `Overcharged by $${ch.discrepancyAmount.toFixed(2)}` :
                 `Undercharged by $${Math.abs(ch.discrepancyAmount).toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Show actual calculation */}
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-gray-500 mb-1">Actual unit price should be:</p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">${ch.invoiceTotal.toFixed(2)} ÷ {ch.quantity}</span>
              <span className="text-gray-400">=</span>
              <span className="font-mono font-bold text-blue-600">${(ch.invoiceTotal / ch.quantity).toFixed(4)}/unit</span>
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

      {/* Invoice info */}
      <div className="bg-emerald-600 text-white rounded-xl p-3">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-4 h-4 opacity-80" />
          <p className="text-xs opacity-80 uppercase tracking-wide">Invoice Verification</p>
        </div>
        <p className="font-mono text-sm">{challenge.invoiceNumber}</p>
        <p className="text-xs mt-1 opacity-70">{challenge.product}</p>
      </div>

      {/* The challenge */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Verify the Unit Price</span>
        </div>

        <div className="space-y-3">
          {/* Invoice line */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-gray-600">Quantity:</span>
              <span className="font-mono font-bold text-lg">{challenge.quantity}</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-gray-600">Invoice Total:</span>
              <span className="font-mono font-bold text-lg text-emerald-600">${challenge.invoiceTotal.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Listed Unit Price:</span>
                <span className="font-mono font-bold text-xl bg-amber-100 text-amber-800 px-3 py-1 rounded-lg">
                  ${challenge.claimedUnitPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Does <span className="font-mono font-bold">{challenge.quantity}</span> × <span className="font-mono font-bold">${challenge.claimedUnitPrice.toFixed(2)}</span> = <span className="font-mono font-bold">${challenge.invoiceTotal.toFixed(2)}</span>?
            </p>
          </div>
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
