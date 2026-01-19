import { memo } from 'react';
import { X, FileText, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import type { ReconciliationReport } from '../../lib/ai/reportGenerator';

interface ReportModalProps {
  report: ReconciliationReport;
  onClose: () => void;
}

function ReportModalComponent({ report, onClose }: ReportModalProps) {
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* PDF-style document container */}
      <div
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: 'Georgia, serif' }}
      >
        {/* PDF-style header */}
        <div className="bg-gray-800 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-lg font-semibold text-white">{report.title}</h2>
              <p className="text-xs text-gray-300">Generated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded hover:bg-gray-700 transition-colors flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* PDF-style document body */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] bg-white">
          {/* Page with margins like a PDF */}
          <div className="px-16 py-12 max-w-[8.5in] mx-auto bg-white shadow-inner">
            {/* Company header */}
            <div className="border-b-2 border-bmf-blue pb-4 mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Big Marble Farms</h1>
              <p className="text-sm text-gray-600">Greenhouse Data Reconciliation System</p>
            </div>

            {/* Executive Summary */}
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-bmf-blue" />
                Executive Summary
              </h2>
              <p className="text-gray-700 leading-relaxed">{report.executiveSummary}</p>
            </section>

            {/* Statistics */}
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Processing Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Total Processed</p>
                  <p className="text-3xl font-bold text-bmf-blue">{report.statistics.totalProcessed}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Clean Matches</p>
                  <p className="text-3xl font-bold text-green-600">{report.statistics.cleanMatches}</p>
                  <p className="text-xs text-green-600 mt-1">
                    ({Math.round((report.statistics.cleanMatches / report.statistics.totalProcessed) * 100)}%)
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-gray-600 mb-1">Discrepancies Found</p>
                  <p className="text-3xl font-bold text-amber-600">{report.statistics.discrepanciesFound}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Avg. Confidence</p>
                  <p className="text-3xl font-bold text-purple-600">{report.statistics.avgConfidence}%</p>
                </div>
              </div>
            </section>

            {/* Clean Shipments */}
            {report.cleanShipments.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Successfully Matched Shipments
                </h2>
                <p className="text-gray-700 mb-3">
                  The following {report.cleanShipments.length} shipments matched perfectly across all data sources:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {report.cleanShipments.map(id => (
                    <div key={id} className="px-3 py-2 bg-green-50 rounded border border-green-200 text-center">
                      <code className="text-sm font-mono text-green-700">{id}</code>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Discrepancies */}
            {report.discrepancyDetails.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Discrepancies Identified
                </h2>
                <div className="space-y-4">
                  {report.discrepancyDetails.map((disc, idx) => (
                    <div key={idx} className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-900">{disc.shipment_id}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          disc.severity === 'critical' ? 'bg-red-200 text-red-800' :
                          disc.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                          disc.severity === 'medium' ? 'bg-amber-200 text-amber-800' :
                          'bg-yellow-200 text-yellow-800'
                        }`}>
                          {disc.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{disc.issue}</p>
                      <div className="mt-3 pt-3 border-t border-amber-200">
                        <p className="text-sm text-gray-600">
                          <strong>Recommended Action:</strong> {disc.recommendation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Process Improvement Recommendations</h2>
                <ol className="space-y-3">
                  {report.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="font-bold text-bmf-blue">{idx + 1}.</span>
                      <p className="text-gray-700">{rec}</p>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Footer */}
            <div className="border-t-2 border-gray-300 pt-6 mt-8">
              <p className="text-xs text-gray-500 text-center">
                This report was generated automatically by the Greenhouse Data Bridge reconciliation system.
                <br />
                For questions or concerns, please contact the Operations Team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ReportModal = memo(ReportModalComponent);
