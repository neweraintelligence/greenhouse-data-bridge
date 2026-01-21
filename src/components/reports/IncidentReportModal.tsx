import { memo, useState } from 'react';
import { X, FileText, AlertTriangle, AlertOctagon, Info, CheckCircle, Camera, MapPin, Clock, User, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface IncidentReportData {
  reportPeriod: string;
  generatedAt: string;
  incidents: IncidentItem[];
  statistics: {
    total: number;
    critical: number;
    moderate: number;
    minor: number;
    resolved: number;
    pending: number;
    avgResolutionTime?: string;
  };
  trends?: {
    direction: 'up' | 'down' | 'stable';
    percentChange: number;
    comparedTo: string;
  };
}

export interface IncidentItem {
  id: string;
  incident_type: string;
  severity: number;
  location: string;
  description: string;
  reported_by: string;
  reported_at: string;
  status: string;
  photo_url?: string;
  ai_confidence?: number;
  routed_to?: string;
}

interface IncidentReportModalProps {
  report: IncidentReportData;
  onClose: () => void;
}

function IncidentReportModalComponent({ report, onClose }: IncidentReportModalProps) {
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', badge: 'bg-red-200 text-red-800' };
    if (severity === 3) return { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-700', badge: 'bg-orange-200 text-orange-800' };
    return { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700', badge: 'bg-yellow-200 text-yellow-800' };
  };

  const getSeverityLabel = (severity: number) => {
    if (severity >= 5) return 'CRITICAL';
    if (severity === 4) return 'HIGH';
    if (severity === 3) return 'MODERATE';
    if (severity === 2) return 'LOW';
    return 'MINOR';
  };

  const criticalIncidents = report.incidents.filter(i => i.severity >= 4);
  const moderateIncidents = report.incidents.filter(i => i.severity === 3);
  const minorIncidents = report.incidents.filter(i => i.severity <= 2);

  const TrendIcon = report.trends?.direction === 'up' ? TrendingUp :
                    report.trends?.direction === 'down' ? TrendingDown : Minus;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Expanded photo overlay */}
      {expandedPhoto && (
        <div
          className="absolute inset-0 z-[10001] flex items-center justify-center bg-black/90"
          onClick={(e) => {
            e.stopPropagation();
            setExpandedPhoto(null);
          }}
        >
          <img
            src={expandedPhoto}
            alt="Incident photo"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
          />
          <button
            onClick={() => setExpandedPhoto(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      )}

      {/* PDF-style document container */}
      <div
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: 'Georgia, serif' }}
      >
        {/* PDF-style header - orange/red gradient for incidents */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-lg font-semibold text-white">Weekly Incident Report</h2>
              <p className="text-xs text-orange-100">{report.reportPeriod} | Generated: {report.generatedAt}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded hover:bg-white/20 transition-colors flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* PDF-style document body */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] bg-white">
          {/* Page with margins like a PDF */}
          <div className="px-16 py-12 max-w-[8.5in] mx-auto bg-white shadow-inner">
            {/* Company header */}
            <div className="border-b-2 border-orange-500 pb-4 mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Big Marble Farms</h1>
              <p className="text-sm text-gray-600">Incident Management System - Weekly Summary</p>
            </div>

            {/* Executive Summary with Trend */}
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                Executive Summary
              </h2>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-gray-700 leading-relaxed">
                    During the reporting period, <strong>{report.statistics.total} incidents</strong> were reported.
                    {report.statistics.critical > 0 && (
                      <span className="text-red-700"> <strong>{report.statistics.critical} critical incident{report.statistics.critical > 1 ? 's' : ''}</strong> required immediate escalation.</span>
                    )}
                    {' '}{report.statistics.resolved} incident{report.statistics.resolved !== 1 ? 's have' : ' has'} been resolved,
                    with {report.statistics.pending} pending review or action.
                  </p>
                </div>
                {report.trends && (
                  <div className={`px-4 py-3 rounded-lg ${
                    report.trends.direction === 'down' ? 'bg-green-50 border border-green-200' :
                    report.trends.direction === 'up' ? 'bg-red-50 border border-red-200' :
                    'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <TrendIcon className={`w-5 h-5 ${
                        report.trends.direction === 'down' ? 'text-green-600' :
                        report.trends.direction === 'up' ? 'text-red-600' :
                        'text-gray-600'
                      }`} />
                      <span className={`text-2xl font-bold ${
                        report.trends.direction === 'down' ? 'text-green-600' :
                        report.trends.direction === 'up' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {report.trends.percentChange}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">vs {report.trends.comparedTo}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Statistics */}
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Incident Statistics</h2>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Total Incidents</p>
                  <p className="text-3xl font-bold text-gray-800">{report.statistics.total}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-gray-600 mb-1">Critical (4-5)</p>
                  <p className="text-3xl font-bold text-red-600">{report.statistics.critical}</p>
                  <p className="text-xs text-red-600 mt-1">
                    ({report.statistics.total > 0 ? Math.round((report.statistics.critical / report.statistics.total) * 100) : 0}%)
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-gray-600 mb-1">Moderate (3)</p>
                  <p className="text-3xl font-bold text-orange-600">{report.statistics.moderate}</p>
                  <p className="text-xs text-orange-600 mt-1">
                    ({report.statistics.total > 0 ? Math.round((report.statistics.moderate / report.statistics.total) * 100) : 0}%)
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-gray-600 mb-1">Minor (1-2)</p>
                  <p className="text-3xl font-bold text-yellow-600">{report.statistics.minor}</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    ({report.statistics.total > 0 ? Math.round((report.statistics.minor / report.statistics.total) * 100) : 0}%)
                  </p>
                </div>
              </div>

              {/* Resolution stats */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-gray-600">Resolved</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{report.statistics.resolved}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                  <p className="text-2xl font-bold text-amber-600">{report.statistics.pending}</p>
                </div>
              </div>
            </section>

            {/* Critical Incidents */}
            {criticalIncidents.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-red-600" />
                  Critical Incidents Requiring Attention
                </h2>
                <div className="space-y-4">
                  {criticalIncidents.map((incident) => {
                    const colors = getSeverityColor(incident.severity);
                    return (
                      <div key={incident.id} className={`p-4 ${colors.bg} rounded-lg border-l-4 ${colors.border}`}>
                        <div className="flex gap-4">
                          {/* Photo thumbnail */}
                          {incident.photo_url && (
                            <div
                              className="w-24 h-24 rounded-lg overflow-hidden shrink-0 cursor-pointer hover:opacity-90 transition-opacity border-2 border-white shadow"
                              onClick={() => setExpandedPhoto(incident.photo_url!)}
                            >
                              <img
                                src={incident.photo_url}
                                alt="Incident"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/30">
                                <Camera className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          )}

                          {/* Incident details */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${colors.badge}`}>
                                  {getSeverityLabel(incident.severity)} - Severity {incident.severity}/5
                                </span>
                                <h3 className="font-bold text-gray-900 mt-1">{incident.incident_type}</h3>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                incident.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                                incident.status === 'Escalated' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {incident.status}
                              </span>
                            </div>

                            <p className={`text-sm ${colors.text} mb-2`}>{incident.description}</p>

                            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {incident.location}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {incident.reported_by}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(incident.reported_at).toLocaleString()}
                              </div>
                              {incident.ai_confidence && (
                                <div className="flex items-center gap-1">
                                  <span className="text-purple-600">AI: {incident.ai_confidence}%</span>
                                </div>
                              )}
                            </div>

                            {incident.routed_to && (
                              <div className="mt-2 text-xs text-gray-500">
                                <strong>Routed to:</strong> {incident.routed_to}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Moderate Incidents */}
            {moderateIncidents.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Moderate Incidents
                </h2>
                <div className="space-y-3">
                  {moderateIncidents.map((incident) => {
                    const colors = getSeverityColor(incident.severity);
                    return (
                      <div key={incident.id} className={`p-3 ${colors.bg} rounded-lg border-l-4 ${colors.border}`}>
                        <div className="flex gap-3">
                          {/* Small photo thumbnail */}
                          {incident.photo_url && (
                            <div
                              className="w-16 h-16 rounded overflow-hidden shrink-0 cursor-pointer hover:opacity-90"
                              onClick={() => setExpandedPhoto(incident.photo_url!)}
                            >
                              <img
                                src={incident.photo_url}
                                alt="Incident"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900 text-sm">{incident.incident_type}</h3>
                              <span className={`px-2 py-0.5 rounded text-xs ${colors.badge}`}>
                                Severity {incident.severity}
                              </span>
                            </div>
                            <p className={`text-xs ${colors.text} mt-1 line-clamp-2`}>{incident.description}</p>
                            <div className="flex gap-3 text-xs text-gray-500 mt-1">
                              <span>{incident.location}</span>
                              <span>{incident.reported_by}</span>
                              <span className={incident.status === 'Resolved' ? 'text-green-600' : 'text-amber-600'}>
                                {incident.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Minor Incidents */}
            {minorIncidents.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-yellow-600" />
                  Minor Incidents (Logged for Tracking)
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Type</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Location</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Reporter</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {minorIncidents.map((incident) => (
                        <tr key={incident.id} className="border-b border-gray-100">
                          <td className="px-3 py-2 text-gray-700">{incident.incident_type}</td>
                          <td className="px-3 py-2 text-gray-600">{incident.location}</td>
                          <td className="px-3 py-2 text-gray-600">{incident.reported_by}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              incident.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {incident.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* No incidents message */}
            {report.incidents.length === 0 && (
              <section className="mb-8 text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Incidents Reported</h3>
                <p className="text-gray-600">No incidents were reported during this period.</p>
              </section>
            )}

            {/* Footer */}
            <div className="border-t-2 border-gray-300 pt-6 mt-8">
              <p className="text-xs text-gray-500 text-center">
                This report was generated automatically by the Greenhouse Data Bridge incident management system.
                <br />
                Critical incidents are automatically escalated per the RACI matrix. For questions, contact the Safety Team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const IncidentReportModal = memo(IncidentReportModalComponent);
