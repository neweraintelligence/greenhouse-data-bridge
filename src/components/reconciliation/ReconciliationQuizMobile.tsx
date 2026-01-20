import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, Eye, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ReconciliationQuizMobileProps {
  sessionCode: string;
  participantName: string;
  onComplete: () => void;
}

// Questions about the reconciled data - participants look at main screen to answer
const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    question: "Look at Row 1 (PO-2024-4521). Is the vendor name consistent across all sources?",
    hint: "Compare: Email, PO Document, Invoice, Receiving Log",
    options: [
      { value: 'yes', label: 'Yes, all match' },
      { value: 'no', label: 'No, there\'s a mismatch' },
    ],
    correctAnswer: 'no', // Nature's Pride Farms vs Natures Pride Farm
    explanation: "The invoice shows 'Natures Pride Farm' (missing apostrophe and 's') while other sources show 'Nature's Pride Farms'",
  },
  {
    id: 'q2',
    question: "Row 2 (PO-2024-4522): Does the received quantity match the ordered quantity?",
    hint: "Compare: Order Qty vs Receiving Log",
    options: [
      { value: 'match', label: 'Quantities match' },
      { value: 'short', label: 'Received LESS than ordered' },
      { value: 'over', label: 'Received MORE than ordered' },
    ],
    correctAnswer: 'short', // Ordered 500, received 498
    explanation: "Ordered 500 units but only 498 were received - a shortage of 2 units",
  },
  {
    id: 'q3',
    question: "Row 3 (PO-2024-4523): Is the product SKU consistent across documents?",
    hint: "Compare: PO SKU vs Bill of Lading SKU",
    options: [
      { value: 'yes', label: 'Yes, SKUs match' },
      { value: 'no', label: 'No, SKU format differs' },
    ],
    correctAnswer: 'no', // TOM-ORG-1KG vs TOM-ORGANIC-1KG
    explanation: "PO shows 'TOM-ORG-1KG' but Bill of Lading shows 'TOM-ORGANIC-1KG' - same product, different format",
  },
  {
    id: 'q4',
    question: "Row 4 (SHP-0034): Was the shipment delivered on the expected date?",
    hint: "Compare: Expected Delivery vs Actual Delivery",
    options: [
      { value: 'ontime', label: 'Yes, delivered on time' },
      { value: 'early', label: 'Delivered early' },
      { value: 'late', label: 'Delivered late' },
    ],
    correctAnswer: 'late', // Expected Jan 15, Actual Jan 16
    explanation: "Expected delivery was Jan 15, but actual delivery was Jan 16 - one day late",
  },
  {
    id: 'q5',
    question: "Row 5 (SHP-0035): Does the delivery address match the ship-to address?",
    hint: "Compare: Ship-To Address vs Delivery Confirmation",
    options: [
      { value: 'exact', label: 'Exact match' },
      { value: 'same_different_format', label: 'Same location, different format' },
      { value: 'different', label: 'Completely different addresses' },
    ],
    correctAnswer: 'same_different_format', // 123 Main St, Warehouse A vs 123 Main Street, WH-A
    explanation: "'123 Main St, Warehouse A' vs '123 Main Street, WH-A' - same place, just abbreviated differently",
  },
  {
    id: 'q6',
    question: "Looking at ALL rows: How many records have discrepancies that need attention?",
    hint: "Count rows with any mismatch across sources",
    options: [
      { value: '2', label: '2 records' },
      { value: '3', label: '3 records' },
      { value: '4', label: '4 records' },
      { value: '5', label: 'All 5 records' },
    ],
    correctAnswer: '5', // All have some issue
    explanation: "All 5 records have some form of discrepancy - vendor name, quantity, SKU format, date, or address format",
  },
];

export function ReconciliationQuizMobile({ sessionCode, participantName, onComplete }: ReconciliationQuizMobileProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / QUIZ_QUESTIONS.length) * 100;

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || hasAnswered) return;

    setIsSubmitting(true);
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    try {
      await supabase.from('reconciliation_quiz_responses').insert({
        session_code: sessionCode,
        participant_name: participantName,
        question_id: currentQuestion.id,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
      });

      if (isCorrect) {
        setScore((prev) => prev + 1);
      }
      setHasAnswered(true);
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setHasAnswered(false);
    } else {
      setIsComplete(true);
    }
  };

  if (isComplete) {
    const percentage = Math.round((score / QUIZ_QUESTIONS.length) * 100);
    return (
      <div className="space-y-6 text-center">
        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${
          percentage >= 80 ? 'bg-green-100' : percentage >= 50 ? 'bg-amber-100' : 'bg-red-100'
        }`}>
          {percentage >= 80 ? (
            <CheckCircle2 className={`w-10 h-10 text-green-600`} />
          ) : (
            <Eye className={`w-10 h-10 ${percentage >= 50 ? 'text-amber-600' : 'text-red-600'}`} />
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Complete!</h2>
          <p className="text-gray-600">
            You scored <span className="font-bold text-bmf-blue">{score}</span> out of {QUIZ_QUESTIONS.length}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
          <p className="text-4xl font-bold text-gray-800 mb-1">{percentage}%</p>
          <p className="text-sm text-gray-500">Accuracy Score</p>
        </div>

        <div className={`p-4 rounded-xl ${
          percentage >= 80 ? 'bg-green-50 border-green-200' :
          percentage >= 50 ? 'bg-amber-50 border-amber-200' :
          'bg-red-50 border-red-200'
        } border`}>
          <p className="text-sm font-medium">
            {percentage >= 80
              ? "Excellent attention to detail! You caught most discrepancies."
              : percentage >= 50
              ? "Good effort! Some discrepancies slipped through."
              : "This is why AI helps - it's easy to miss things in large datasets!"}
          </p>
        </div>

        <p className="text-xs text-gray-400">
          AI would catch all 5 discrepancies in under 0.1 seconds
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Question {currentQuestionIndex + 1} of {QUIZ_QUESTIONS.length}</span>
        <span className="font-medium text-bmf-blue">{score} correct</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-bmf-blue transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Look at screen reminder */}
      <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
        <Eye className="w-5 h-5 text-indigo-600 shrink-0" />
        <p className="text-sm text-indigo-800">
          Look at the <strong>main screen</strong> to see the data, then answer here
        </p>
      </div>

      {/* Question */}
      <div className="p-4 bg-white border-2 border-gray-200 rounded-xl">
        <p className="font-semibold text-gray-800 mb-2">{currentQuestion.question}</p>
        <p className="text-xs text-gray-500">{currentQuestion.hint}</p>
      </div>

      {/* Answer options */}
      <div className="space-y-2">
        {currentQuestion.options.map((option) => {
          const isSelected = selectedAnswer === option.value;
          const isCorrect = option.value === currentQuestion.correctAnswer;
          const showResult = hasAnswered;

          let buttonStyle = 'bg-white border-gray-200 hover:border-bmf-blue hover:bg-blue-50';
          if (isSelected && !showResult) {
            buttonStyle = 'bg-bmf-blue/10 border-bmf-blue';
          }
          if (showResult) {
            if (isCorrect) {
              buttonStyle = 'bg-green-50 border-green-500';
            } else if (isSelected && !isCorrect) {
              buttonStyle = 'bg-red-50 border-red-500';
            }
          }

          return (
            <button
              key={option.value}
              onClick={() => !hasAnswered && setSelectedAnswer(option.value)}
              disabled={hasAnswered}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${buttonStyle}`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-medium ${
                  showResult && isCorrect ? 'text-green-700' :
                  showResult && isSelected && !isCorrect ? 'text-red-700' :
                  isSelected ? 'text-bmf-blue' : 'text-gray-700'
                }`}>
                  {option.label}
                </span>
                {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Explanation (after answering) */}
      {hasAnswered && (
        <div className={`p-3 rounded-xl ${
          selectedAnswer === currentQuestion.correctAnswer
            ? 'bg-green-50 border border-green-200'
            : 'bg-amber-50 border border-amber-200'
        }`}>
          <p className="text-sm text-gray-700">{currentQuestion.explanation}</p>
        </div>
      )}

      {/* Submit / Next button */}
      {!hasAnswered ? (
        <button
          onClick={handleSubmitAnswer}
          disabled={!selectedAnswer || isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-bmf-blue text-white font-semibold hover:bg-bmf-blue-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Checking...
            </>
          ) : (
            'Submit Answer'
          )}
        </button>
      ) : (
        <button
          onClick={handleNextQuestion}
          className="w-full py-3 px-4 rounded-xl bg-gray-800 text-white font-semibold hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
        >
          {currentQuestionIndex < QUIZ_QUESTIONS.length - 1 ? (
            <>
              Next Question
              <ArrowRight className="w-5 h-5" />
            </>
          ) : (
            'See Results'
          )}
        </button>
      )}
    </div>
  );
}
