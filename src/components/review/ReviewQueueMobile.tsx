import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Clock, Send, Loader2, ChevronRight, Bot } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ReviewQueueMobileProps {
  sessionCode: string;
  participantName: string;
  onComplete: () => void;
}

interface ReviewItem {
  id: string;
  discrepancy_type: string;
  severity: string;
  field_name: string;
  source_a_label: string;
  source_a_value: string;
  source_b_label: string;
  source_b_value: string;
  reference_id: string | null;
  ai_confidence: number | null;
  ai_suggestion: string | null;
  status: string;
}

// Sample discrepancies to seed if none exist
const SAMPLE_DISCREPANCIES = [
  {
    discrepancy_type: 'vendor_name',
    severity: 'medium',
    field_name: 'Vendor Name',
    source_a_label: 'Purchase Order',
    source_a_value: "Nature's Pride Farms",
    source_b_label: 'Invoice',
    source_b_value: 'Natures Pride Farm',
    reference_id: 'PO-2024-4521',
    ai_confidence: 85,
    ai_suggestion: 'likely_same',
  },
  {
    discrepancy_type: 'quantity',
    severity: 'high',
    field_name: 'Quantity',
    source_a_label: 'Order',
    source_a_value: '500 units',
    source_b_label: 'Receiving Log',
    source_b_value: '498 units',
    reference_id: 'PO-2024-4522',
    ai_confidence: 60,
    ai_suggestion: 'uncertain',
  },
  {
    discrepancy_type: 'sku',
    severity: 'low',
    field_name: 'Product SKU',
    source_a_label: 'Purchase Order',
    source_a_value: 'TOM-ORG-1KG',
    source_b_label: 'Bill of Lading',
    source_b_value: 'TOM-ORGANIC-1KG',
    reference_id: 'PO-2024-4523',
    ai_confidence: 92,
    ai_suggestion: 'likely_same',
  },
  {
    discrepancy_type: 'date',
    severity: 'low',
    field_name: 'Delivery Date',
    source_a_label: 'Expected',
    source_a_value: 'Jan 15, 2024',
    source_b_label: 'Actual',
    source_b_value: 'Jan 16, 2024',
    reference_id: 'SHP-0034',
    ai_confidence: 100,
    ai_suggestion: 'likely_different',
  },
  {
    discrepancy_type: 'address',
    severity: 'medium',
    field_name: 'Destination',
    source_a_label: 'Ship-To Address',
    source_a_value: '123 Main St, Warehouse A',
    source_b_label: 'Delivery Confirmation',
    source_b_value: '123 Main Street, WH-A',
    reference_id: 'SHP-0035',
    ai_confidence: 88,
    ai_suggestion: 'likely_same',
  },
];

export function ReviewQueueMobile({ sessionCode, participantName, onComplete }: ReviewQueueMobileProps) {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comment, setComment] = useState('');
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    loadOrSeedItems();
  }, [sessionCode]);

  const loadOrSeedItems = async () => {
    try {
      // Check for existing pending items
      const { data: existingItems, error: fetchError } = await supabase
        .from('review_queue_items')
        .select('*')
        .eq('session_code', sessionCode)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      if (existingItems && existingItems.length > 0) {
        setItems(existingItems);
      } else {
        // Seed sample discrepancies
        const itemsToSeed = SAMPLE_DISCREPANCIES.map((item) => ({
          ...item,
          session_code: sessionCode,
          status: 'pending',
        }));

        const { data: seededItems, error: seedError } = await supabase
          .from('review_queue_items')
          .insert(itemsToSeed)
          .select();

        if (seedError) throw seedError;
        setItems(seededItems || []);
      }
    } catch (err) {
      console.error('Error loading review items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecision = async (decision: 'accept' | 'reject') => {
    const currentItem = items[currentIndex];
    if (!currentItem) return;

    setIsSubmitting(true);

    try {
      // Record the decision
      const { error: decisionError } = await supabase
        .from('review_decisions')
        .insert({
          session_code: sessionCode,
          item_type: currentItem.discrepancy_type,
          item_id: currentItem.id,
          decision,
          decided_by: participantName,
          comment: comment.trim() || null,
        });

      if (decisionError) throw decisionError;

      // Update item status
      const { error: updateError } = await supabase
        .from('review_queue_items')
        .update({ status: decision === 'accept' ? 'accepted' : 'rejected' })
        .eq('id', currentItem.id);

      if (updateError) throw updateError;

      // Move to next item
      setComment('');
      setCompletedCount((prev) => prev + 1);

      if (currentIndex < items.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // All items reviewed
        onComplete();
      }
    } catch (err) {
      console.error('Error submitting decision:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-bmf-blue animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-800">All Clear!</h3>
        <p className="text-gray-500 text-sm">No items pending review</p>
      </div>
    );
  }

  const currentItem = items[currentIndex];
  const progress = ((currentIndex) / items.length) * 100;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getConfidenceColor = (confidence: number | null) => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 85) return 'text-green-600';
    if (confidence >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">
          Item {currentIndex + 1} of {items.length}
        </span>
        <span className="text-sm font-medium text-bmf-blue">
          {completedCount} reviewed
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-bmf-blue transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* AI Flag Header */}
      <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
        <Bot className="w-5 h-5 text-indigo-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-indigo-800">AI Flagged for Review</p>
          <p className="text-xs text-indigo-600">Needs human judgment</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(currentItem.severity)}`}>
          {currentItem.severity.toUpperCase()}
        </span>
      </div>

      {/* Discrepancy Card */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
        {/* Reference */}
        {currentItem.reference_id && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-xs text-gray-500">Reference: </span>
            <span className="text-xs font-mono font-medium text-gray-700">{currentItem.reference_id}</span>
          </div>
        )}

        {/* Field being compared */}
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wider">{currentItem.field_name}</p>
        </div>

        {/* Side by side comparison */}
        <div className="grid grid-cols-2 divide-x divide-gray-200">
          {/* Source A */}
          <div className="p-4">
            <p className="text-xs text-gray-500 mb-2">{currentItem.source_a_label}</p>
            <p className="font-medium text-gray-800">{currentItem.source_a_value}</p>
          </div>

          {/* Source B */}
          <div className="p-4 bg-amber-50/50">
            <p className="text-xs text-gray-500 mb-2">{currentItem.source_b_label}</p>
            <p className="font-medium text-gray-800">{currentItem.source_b_value}</p>
          </div>
        </div>

        {/* AI Assessment */}
        {currentItem.ai_confidence !== null && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">AI Confidence:</span>
              <span className={`text-sm font-bold ${getConfidenceColor(currentItem.ai_confidence)}`}>
                {currentItem.ai_confidence}%
              </span>
            </div>
            {currentItem.ai_suggestion && (
              <p className="text-xs text-gray-500 mt-1">
                AI thinks:{' '}
                <span className="font-medium">
                  {currentItem.ai_suggestion === 'likely_same' && 'Probably the same'}
                  {currentItem.ai_suggestion === 'likely_different' && 'Probably different'}
                  {currentItem.ai_suggestion === 'uncertain' && 'Uncertain - needs review'}
                </span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Comment input - REQUIRED */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">
          Why are you making this decision? <span className="text-red-500">*</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="e.g., 'Same vendor, just a typo' or 'Quantities don't match - needs investigation'"
          rows={2}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bmf-blue/20 focus:border-bmf-blue resize-none text-sm"
        />
        {!comment.trim() && (
          <p className="text-xs text-amber-600 mt-1">A reason is required for accountability</p>
        )}
      </div>

      {/* Decision buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleDecision('reject')}
          disabled={isSubmitting || !comment.trim()}
          className="py-3 px-4 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 font-semibold hover:bg-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <XCircle className="w-5 h-5" />
              Reject
            </>
          )}
        </button>

        <button
          onClick={() => handleDecision('accept')}
          disabled={isSubmitting || !comment.trim()}
          className="py-3 px-4 rounded-xl bg-green-50 border-2 border-green-200 text-green-700 font-semibold hover:bg-green-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Accept
            </>
          )}
        </button>
      </div>

      {/* Accountability hint */}
      <p className="text-xs text-gray-400 text-center">
        Your name and reasoning will be visible to the presenter.
      </p>
    </div>
  );
}
