import { memo, useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import type { Discrepancy } from '../../lib/processing/types';
import { ConfidenceIndicator } from '../design-system';

interface DiscrepancyDecisionModalProps {
  discrepancy: Discrepancy;
  onClose: () => void;
  onDecision: (decision: 'approved' | 'rejected' | 'escalated', comment?: string) => void;
}

function DiscrepancyDecisionModalComponent({
  discrepancy,
  onClose,
  onDecision,
}: DiscrepancyDecisionModalProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDecision = async (decision: 'approved' | 'rejected' | 'escalated') => {
    setIsSubmitting(true);
    await onDecision(decision, comment);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-amber-500 to-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Discrepancy Review
              </h2>
              <p className="text-white/80 text-sm">{discrepancy.shipment_id}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Discrepancy type and severity */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`px-4 py-2 rounded-xl font-semibold ${
              discrepancy.severity === 'critical' ? 'bg-red-100 text-red-700' :
              discrepancy.severity === 'high' ? 'bg-orange-100 text-orange-700' :
              discrepancy.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {discrepancy.severity.toUpperCase()} SEVERITY
            </div>
            <div className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-medium">
              {discrepancy.type.replace(/_/g, ' ').toUpperCase()}
            </div>
          </div>

          {/* Details */}
          <div className="mb-8">
            <p className="text-lg text-gray-800 mb-4" style={{ fontFamily: 'var(--font-body)' }}>
              {discrepancy.details}
            </p>

            <div className="grid grid-cols-2 gap-4 p-6 rounded-2xl bg-gray-50">
              <div>
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Expected</p>
                <p className="text-2xl font-bold text-gray-900">{discrepancy.expected}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Actual</p>
                <p className="text-2xl font-bold text-red-600">{discrepancy.actual}</p>
              </div>
              {discrepancy.difference !== undefined && (
                <div className="col-span-2 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Difference</p>
                  <p className="text-xl font-bold text-orange-600">
                    {typeof discrepancy.difference === 'number' && discrepancy.difference < 0 ? '+' : ''}
                    {Math.abs(Number(discrepancy.difference))} units
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Confidence score */}
          <div className="mb-8">
            <p className="text-sm text-gray-600 mb-3">Data Confidence:</p>
            <ConfidenceIndicator score={discrepancy.confidence} />
          </div>

          {/* Recommended action */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">Recommended Action:</p>
                <p className="text-sm text-blue-700">{discrepancy.recommendedAction}</p>
              </div>
            </div>
          </div>

          {/* Comment field */}
          <div className="mb-8">
            <label className="flex items-center gap-2 text-sm text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4" />
              Add Comment (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add notes about this decision..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-bmf-blue focus:ring-2 focus:ring-bmf-blue/20 outline-none resize-none"
              rows={3}
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>

          {/* Decision buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => handleDecision('approved')}
              disabled={isSubmitting}
              className="flex-1 px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <CheckCircle className="w-5 h-5" />
              Approve
            </button>
            <button
              onClick={() => handleDecision('rejected')}
              disabled={isSubmitting}
              className="flex-1 px-6 py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <XCircle className="w-5 h-5" />
              Reject
            </button>
            <button
              onClick={() => handleDecision('escalated')}
              disabled={isSubmitting}
              className="flex-1 px-6 py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <AlertTriangle className="w-5 h-5" />
              Escalate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const DiscrepancyDecisionModal = memo(DiscrepancyDecisionModalComponent);
