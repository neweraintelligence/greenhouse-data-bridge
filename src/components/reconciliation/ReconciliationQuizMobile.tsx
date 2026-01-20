import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, Eye, ArrowRight, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ReconciliationQuizMobileProps {
  sessionCode: string;
  participantName: string;
  onComplete: () => void;
}

interface MergedRecord {
  shipment_id: string;
  expected_qty: number | null;
  expected_sku: string | null;
  vendor: string | null;
  scanned_qty: number | null;
  scanned_sku: string | null;
  scanned_by: string | null;
  received_qty: number | null;
  condition: string | null;
  receiver_name: string | null;
  hasQtyDiscrepancy: boolean;
  hasSkuDiscrepancy: boolean;
  hasConditionIssue: boolean;
  isMissingData: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  hint: string;
  options: { value: string; label: string }[];
  correctAnswer: string;
  explanation: string;
}

// Generate questions dynamically based on actual data
function generateQuestionsFromData(mergedData: MergedRecord[]): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  let questionId = 1;

  // Find records with differences between sources
  const qtyDifferences = mergedData.filter(r => r.hasQtyDiscrepancy && !r.isMissingData);
  const receivedRecords = mergedData.filter(r => r.received_qty !== null);
  const notReceivedRecords = mergedData.filter(r => r.received_qty === null);

  // Question 1: Simple "Was it received?" question
  if (receivedRecords.length > 0) {
    const record = receivedRecords[0];
    questions.push({
      id: `q${questionId++}`,
      question: `Shipment ${record.shipment_id}: Was it received?`,
      hint: `Check if there's a value in the Received Qty column`,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
      correctAnswer: 'yes',
      explanation: `Yes - received ${record.received_qty} units.`,
    });
  }

  // Question 2: "Who scanned it?" question
  if (receivedRecords.length > 0) {
    const record = receivedRecords.find(r => r.scanned_by) || receivedRecords[0];
    if (record.scanned_by) {
      questions.push({
        id: `q${questionId++}`,
        question: `Shipment ${record.shipment_id}: Who scanned it?`,
        hint: `Check the "Scanned By" column`,
        options: [
          { value: 'correct', label: record.scanned_by },
          { value: 'wrong1', label: '[Demo] Alex Wong' },
          { value: 'wrong2', label: 'Not scanned' },
        ],
        correctAnswer: 'correct',
        explanation: `Scanned by: ${record.scanned_by}`,
      });
    }
  }

  // Question 3: "Who signed for it?" question
  if (receivedRecords.length > 1) {
    const record = receivedRecords.find(r => r.receiver_name) || receivedRecords[1];
    if (record.receiver_name) {
      questions.push({
        id: `q${questionId++}`,
        question: `Shipment ${record.shipment_id}: Who signed for it?`,
        hint: `Check the "Signed By" column`,
        options: [
          { value: 'correct', label: record.receiver_name },
          { value: 'wrong1', label: '[Demo] John Smith' },
          { value: 'wrong2', label: 'Not signed' },
        ],
        correctAnswer: 'correct',
        explanation: `Signed by: ${record.receiver_name}`,
      });
    }
  }

  // Question 4: Quantity match question
  if (qtyDifferences.length > 0) {
    const record = qtyDifferences[0];
    questions.push({
      id: `q${questionId++}`,
      question: `Shipment ${record.shipment_id}: Do the quantities match?`,
      hint: `Compare Expected Qty vs Scanned Qty vs Received Qty`,
      options: [
        { value: 'yes', label: 'Yes, all match' },
        { value: 'no', label: 'No, there\'s a difference' },
      ],
      correctAnswer: 'no',
      explanation: `Expected: ${record.expected_qty}, Scanned: ${record.scanned_qty}, Received: ${record.received_qty}`,
    });
  } else if (receivedRecords.length > 0) {
    // If no qty differences, ask about a matching one
    const record = receivedRecords[0];
    questions.push({
      id: `q${questionId++}`,
      question: `Shipment ${record.shipment_id}: Do the quantities match?`,
      hint: `Compare Expected Qty vs Scanned Qty vs Received Qty`,
      options: [
        { value: 'yes', label: 'Yes, all match' },
        { value: 'no', label: 'No, there\'s a difference' },
      ],
      correctAnswer: 'yes',
      explanation: `All quantities show ${record.expected_qty} - they match.`,
    });
  }

  // Question 5: Count question - how many received?
  const receivedCount = receivedRecords.length;
  const totalCount = mergedData.length;
  questions.push({
    id: `q${questionId++}`,
    question: `How many shipments have been received?`,
    hint: `Count rows with a value in the Received Qty column`,
    options: [
      { value: String(receivedCount), label: `${receivedCount} of ${totalCount}` },
      { value: String(Math.max(0, receivedCount - 1)), label: `${Math.max(0, receivedCount - 1)} of ${totalCount}` },
      { value: String(Math.min(totalCount, receivedCount + 1)), label: `${Math.min(totalCount, receivedCount + 1)} of ${totalCount}` },
    ],
    correctAnswer: String(receivedCount),
    explanation: `${receivedCount} out of ${totalCount} shipments show received quantities.`,
  });

  // Question 6: Not received question (if any exist)
  if (notReceivedRecords.length > 0) {
    const record = notReceivedRecords[0];
    questions.push({
      id: `q${questionId++}`,
      question: `Shipment ${record.shipment_id}: Was it received?`,
      hint: `Check if there's a value in the Received Qty column`,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
      correctAnswer: 'no',
      explanation: `No received quantity recorded yet.`,
    });
  }

  return questions;
}

export function ReconciliationQuizMobile({ sessionCode, participantName, onComplete: _onComplete }: ReconciliationQuizMobileProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Load real session data and generate questions
  useEffect(() => {
    const loadDataAndGenerateQuestions = async () => {
      if (!sessionCode) {
        setDataError('No session code provided');
        setIsLoadingData(false);
        return;
      }

      try {
        // Fetch all 3 sources in parallel (same as ReconciliationDataView)
        const [expectedRes, scannedRes, receivedRes] = await Promise.all([
          supabase.from('shipments_expected').select('*').eq('session_code', sessionCode),
          supabase.from('barcode_scans').select('*').eq('session_code', sessionCode),
          supabase.from('shipments_received').select('*').eq('session_code', sessionCode),
        ]);

        const expected = expectedRes.data || [];
        const scanned = scannedRes.data || [];
        const received = receivedRes.data || [];

        if (expected.length === 0) {
          setDataError('No shipment data found for this session');
          setIsLoadingData(false);
          return;
        }

        // Create a map of all unique shipment IDs
        const shipmentIds = new Set<string>();
        expected.forEach((e: { shipment_id: string }) => shipmentIds.add(e.shipment_id));
        scanned.forEach((s: { shipment_id: string }) => shipmentIds.add(s.shipment_id));
        received.forEach((r: { shipment_id: string }) => shipmentIds.add(r.shipment_id));

        // Merge the data
        const merged: MergedRecord[] = Array.from(shipmentIds).map(shipmentId => {
          const exp = expected.find((e: { shipment_id: string }) => e.shipment_id === shipmentId);
          const scan = scanned.find((s: { shipment_id: string }) => s.shipment_id === shipmentId);
          const recv = received.find((r: { shipment_id: string }) => r.shipment_id === shipmentId);

          const hasQtyDiscrepancy =
            (exp && scan && exp.expected_qty !== scan.qty_scanned) ||
            (scan && recv && scan.qty_scanned !== recv.received_qty) ||
            (exp && recv && exp.expected_qty !== recv.received_qty);

          const hasSkuDiscrepancy = (exp && scan && exp.expected_sku !== scan.sku);
          const hasConditionIssue = recv?.condition && recv.condition !== 'Good condition';
          const isMissingData = !exp || !scan || !recv;

          return {
            shipment_id: shipmentId,
            expected_qty: exp?.expected_qty ?? null,
            expected_sku: exp?.expected_sku ?? null,
            vendor: exp?.vendor ?? null,
            scanned_qty: scan?.qty_scanned ?? null,
            scanned_sku: scan?.sku ?? null,
            scanned_by: scan?.scanned_by ?? null,
            received_qty: recv?.received_qty ?? null,
            condition: recv?.condition ?? null,
            receiver_name: recv?.receiver_name ?? null,
            hasQtyDiscrepancy: !!hasQtyDiscrepancy,
            hasSkuDiscrepancy: !!hasSkuDiscrepancy,
            hasConditionIssue: !!hasConditionIssue,
            isMissingData,
          };
        });

        // Sort by shipment ID
        merged.sort((a, b) => a.shipment_id.localeCompare(b.shipment_id));

        // Generate questions from actual data
        const generatedQuestions = generateQuestionsFromData(merged);
        setQuestions(generatedQuestions);
      } catch (err) {
        console.error('Error loading reconciliation data for quiz:', err);
        setDataError('Failed to load session data');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadDataAndGenerateQuestions();
  }, [sessionCode]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex) / questions.length) * 100 : 0;

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || hasAnswered || !currentQuestion) return;

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
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setHasAnswered(false);
    } else {
      setIsComplete(true);
    }
  };

  // Loading state
  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 text-bmf-blue animate-spin" />
        <p className="text-gray-600">Loading session data...</p>
      </div>
    );
  }

  // Error state
  if (dataError || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <div>
          <p className="font-medium text-gray-800">Unable to load quiz</p>
          <p className="text-sm text-gray-500 mt-1">{dataError || 'No data available for this session'}</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);
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
            You scored <span className="font-bold text-bmf-blue">{score}</span> out of {questions.length}
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
          AI would catch all discrepancies in under 0.1 seconds
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Question {currentQuestionIndex + 1} of {questions.length}</span>
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
          {currentQuestionIndex < questions.length - 1 ? (
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
