import { memo } from 'react';
import { X, AlertTriangle, Package, TrendingDown, TrendingUp } from 'lucide-react';
import type { Discrepancy } from '../../lib/processing/types';

interface DiscrepancyListModalProps {
  discrepancies: Discrepancy[];
  onClose: () => void;
  onSelectDiscrepancy: (disc: Discrepancy) => void;
}

function DiscrepancyListModalComponent({
  discrepancies,
  onClose,
  onSelectDiscrepancy,
}: DiscrepancyListModalProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-300';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quantity_mismatch': return TrendingDown;
      case 'sku_mismatch': return Package;
      case 'missing_scan': return AlertTriangle;
      default: return AlertTriangle;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-white" />
            <h2 className="text-lg font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Discrepancies Detected ({discrepancies.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* List */}
        <div className="p-6 space-y-3 overflow-y-auto max-h-[calc(80vh-100px)]">
          {discrepancies.map((disc) => {
            const Icon = getTypeIcon(disc.type);

            return (
              <div
                key={disc.id}
                onClick={() => onSelectDiscrepancy(disc)}
                className={`p-4 rounded-xl border-2 cursor-pointer hover:shadow-md transition-all ${getSeverityColor(disc.severity)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white/50">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                        {disc.shipment_id}: {disc.type.replace(/_/g, ' ').toUpperCase()}
                      </h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-white/70 font-medium">
                        {disc.severity.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-sm mb-3" style={{ fontFamily: 'var(--font-body)', fontWeight: 300 }}>
                      {disc.details}
                    </p>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600">Expected:</span>
                        <code className="px-2 py-0.5 bg-white/70 rounded font-mono">{disc.expected}</code>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600">Actual:</span>
                        <code className="px-2 py-0.5 bg-white/70 rounded font-mono">{disc.actual}</code>
                      </div>
                      {disc.difference !== undefined && (
                        <div className="flex items-center gap-1">
                          {typeof disc.difference === 'number' && disc.difference < 0 ? (
                            <TrendingUp className="w-3 h-3 text-green-600" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-600" />
                          )}
                          <code className="px-2 py-0.5 bg-white/70 rounded font-mono font-semibold">
                            {disc.difference}
                          </code>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/50">
                      <p className="text-xs italic text-gray-700">
                        → {disc.recommendedAction}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center" style={{ fontFamily: 'var(--font-body)' }}>
            Click any discrepancy to review and make a decision
          </p>
        </div>
      </div>
    </div>
  );
}

export const DiscrepancyListModal = memo(DiscrepancyListModalComponent);
