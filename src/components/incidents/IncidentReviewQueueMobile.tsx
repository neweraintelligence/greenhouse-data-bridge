import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, Loader2, Bot, Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface IncidentReviewQueueMobileProps {
  sessionCode: string;
  participantName: string;
  onComplete: () => void;
}

interface IncidentReviewItem {
  id: string;
  incident_type: string;
  severity: number;
  location: string;
  description: string;
  photo_url?: string;
  ai_confidence: number;
  ai_classification: string; // 'real_incident' | 'false_positive' | 'ambiguous'
  review_reason: string;
  reported_by: string;
  reported_at: string;
  status: string;
}

// Sample incidents for review queue demo
const SAMPLE_REVIEW_INCIDENTS: Omit<IncidentReviewItem, 'id'>[] = [
  {
    incident_type: 'Possible Nutrient Deficiency',
    severity: 3,
    location: 'Zone 2 - Row 8',
    description: 'Yellowing leaves observed on cucumber plants. Could be nitrogen deficiency, overwatering, or early disease.',
    photo_url: 'https://placehold.co/600x400/f39c12/white?text=Ambiguous:+Nutrient+Deficiency?',
    ai_confidence: 62,
    ai_classification: 'ambiguous',
    review_reason: 'Low AI confidence (62%) - pattern unclear',
    reported_by: 'Demo User',
    reported_at: new Date().toISOString(),
    status: 'pending_review',
  },
  {
    incident_type: 'Dropped Glove',
    severity: 1,
    location: 'Pack House - Station 3',
    description: 'Blue nitrile glove found on growing bench. No contamination detected.',
    photo_url: 'https://placehold.co/600x400/95a5a6/white?text=Dropped+Glove',
    ai_confidence: 89,
    ai_classification: 'false_positive',
    review_reason: 'AI suggests not a real incident - confirm dismissal',
    reported_by: 'Demo User',
    reported_at: new Date().toISOString(),
    status: 'pending_review',
  },
  {
    incident_type: 'Normal Packing Operations',
    severity: 1,
    location: 'Pack House - Main Floor',
    description: 'Workers packing produce boxes with Big Marble Farms branding. Standard operations.',
    photo_url: 'https://placehold.co/600x400/7f8c8d/white?text=Normal+Packing+Operations',
    ai_confidence: 94,
    ai_classification: 'false_positive',
    review_reason: 'AI suggests not a real incident - confirm dismissal',
    reported_by: 'Demo User',
    reported_at: new Date().toISOString(),
    status: 'pending_review',
  },
  {
    incident_type: 'Possible Irrigation Issue',
    severity: 3,
    location: 'Zone 4 - Row 15',
    description: 'Wet spot detected under growing bench. Could be irrigation leak or condensation.',
    photo_url: 'https://placehold.co/600x400/3498db/white?text=Wet+Spot+-+Review',
    ai_confidence: 71,
    ai_classification: 'ambiguous',
    review_reason: 'Moderate confidence - needs human verification',
    reported_by: 'Demo User',
    reported_at: new Date().toISOString(),
    status: 'pending_review',
  },
];

export function IncidentReviewQueueMobile({
  sessionCode,
  participantName,
  onComplete,
}: IncidentReviewQueueMobileProps) {
  const [items, setItems] = useState<IncidentReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comment, setComment] = useState('');
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    loadOrSeedItems();
  }, [sessionCode]);

  const loadOrSeedItems = async () => {
    setIsLoading(true);
    try {
      // Try to load existing review items
      const { data, error } = await supabase
        .from('incident_review_queue')
        .select('*')
        .eq('session_code', sessionCode)
        .eq('status', 'pending_review')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading incident review items:', error);
        // Fall back to sample data
        setItems(SAMPLE_REVIEW_INCIDENTS.map((item, i) => ({
          ...item,
          id: `sample-${i}`,
        })));
      } else if (data && data.length > 0) {
        setItems(data as IncidentReviewItem[]);
      } else {
        // Use sample data for demo
        setItems(SAMPLE_REVIEW_INCIDENTS.map((item, i) => ({
          ...item,
          id: `sample-${i}`,
        })));
      }
    } catch (err) {
      console.error('Error:', err);
      setItems(SAMPLE_REVIEW_INCIDENTS.map((item, i) => ({
        ...item,
        id: `sample-${i}`,
      })));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecision = async (decision: 'confirm_incident' | 'dismiss' | 'escalate') => {
    const currentItem = items[currentIndex];
    if (!currentItem) return;

    setIsSubmitting(true);

    try {
      // Record the decision
      await supabase.from('incident_review_decisions').insert({
        session_code: sessionCode,
        incident_id: currentItem.id,
        decision,
        comment: comment || null,
        decided_by: participantName,
        decided_at: new Date().toISOString(),
      });

      // Update incident status
      const newStatus = decision === 'dismiss'
        ? 'dismissed'
        : decision === 'escalate'
        ? 'escalated'
        : 'confirmed';

      await supabase
        .from('incidents')
        .update({ status: newStatus })
        .eq('id', currentItem.id);

    } catch (err) {
      console.error('Error recording decision:', err);
    }

    setCompletedCount(prev => prev + 1);
    setComment('');

    // Move to next item or complete
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }

    setIsSubmitting(false);
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
      <div className="text-center py-12">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900">All Clear!</h3>
        <p className="text-gray-600 mt-1">No incidents pending review</p>
      </div>
    );
  }

  const currentItem = items[currentIndex];
  const progress = ((currentIndex + 1) / items.length) * 100;

  const getClassificationBadge = () => {
    switch (currentItem.ai_classification) {
      case 'false_positive':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
            Likely False Positive
          </span>
        );
      case 'ambiguous':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
            Ambiguous - Needs Review
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
            Pending Verification
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Reviewing {currentIndex + 1} of {items.length}
          </span>
          <span className="text-gray-500">{completedCount} completed</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-bmf-blue h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Incident card */}
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        {/* Photo */}
        {currentItem.photo_url && (
          <div className="relative aspect-video bg-gray-100">
            <img
              src={currentItem.photo_url}
              alt="Incident"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2">
              {getClassificationBadge()}
            </div>
          </div>
        )}

        {/* Details */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900">{currentItem.incident_type}</h3>
            <p className="text-sm text-gray-600">{currentItem.location}</p>
          </div>

          <p className="text-sm text-gray-700">{currentItem.description}</p>

          {/* AI Analysis */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Bot className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">AI Analysis</p>
                <p className="text-xs text-blue-700 mt-1">{currentItem.review_reason}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-blue-600">Confidence:</span>
                  <div className="flex-1 bg-blue-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        currentItem.ai_confidence >= 80 ? 'bg-green-500' :
                        currentItem.ai_confidence >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${currentItem.ai_confidence}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-blue-800">
                    {currentItem.ai_confidence}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Comment input */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Add note (optional)
            </label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Your observations..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-bmf-blue focus:ring-1 focus:ring-bmf-blue outline-none"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-3 text-center">What should we do with this report?</p>
          <div className="grid grid-cols-3 gap-2">
            {/* Dismiss */}
            <button
              onClick={() => handleDecision('dismiss')}
              disabled={isSubmitting}
              className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-6 h-6" />
              <span className="text-xs font-medium">Dismiss</span>
              <span className="text-[10px] text-gray-500">Not an issue</span>
            </button>

            {/* Confirm */}
            <button
              onClick={() => handleDecision('confirm_incident')}
              disabled={isSubmitting}
              className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-xs font-medium">Confirm</span>
              <span className="text-[10px] text-orange-600">Log incident</span>
            </button>

            {/* Escalate */}
            <button
              onClick={() => handleDecision('escalate')}
              disabled={isSubmitting}
              className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 transition-colors disabled:opacity-50"
            >
              <AlertTriangle className="w-6 h-6" />
              <span className="text-xs font-medium">Escalate</span>
              <span className="text-[10px] text-red-600">Urgent action</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <button
          onClick={() => setCurrentIndex(prev => Math.min(items.length - 1, prev + 1))}
          disabled={currentIndex === items.length - 1}
          className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
