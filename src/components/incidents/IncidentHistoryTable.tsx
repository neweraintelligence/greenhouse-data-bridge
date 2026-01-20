import { memo, useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, XCircle, ArrowUpRight, Filter, Search, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Incident {
  id: string;
  incident_type: string;
  severity: number;
  location: string;
  description: string;
  reported_by: string;
  reported_at: string;
  status: string;
  routed_to?: string;
  ai_confidence?: number;
  photo_url?: string;
}

interface IncidentHistoryTableProps {
  sessionCode: string;
  onViewIncident?: (incident: Incident) => void;
  maxRows?: number;
}

// Sample data for demo
const SAMPLE_INCIDENTS: Incident[] = [
  {
    id: '1',
    incident_type: 'Aphid Infestation',
    severity: 5,
    location: 'Zone 2 - Row 5',
    description: 'Heavy aphid presence on lettuce plants, spreading rapidly',
    reported_by: 'Maria G.',
    reported_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
    status: 'Escalated',
    routed_to: 'Safety Team',
    ai_confidence: 94,
  },
  {
    id: '2',
    incident_type: 'LED Grow Light Failure',
    severity: 4,
    location: 'Zone 3 - Section B',
    description: 'Section of LED fixtures dark, plants showing light stress',
    reported_by: 'James T.',
    reported_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
    status: 'Escalated',
    routed_to: 'Maintenance Team',
    ai_confidence: 91,
  },
  {
    id: '3',
    incident_type: 'Powdery Mildew',
    severity: 4,
    location: 'Zone 1 - Row 12',
    description: 'White powdery coating on cucumber leaves, early stage',
    reported_by: 'Sarah K.',
    reported_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hrs ago
    status: 'In Progress',
    routed_to: 'Safety Team',
    ai_confidence: 88,
  },
  {
    id: '4',
    incident_type: 'Irrigation Leak',
    severity: 3,
    location: 'Zone 4 - Row 8',
    description: 'Drip line leak causing water pooling under bench',
    reported_by: 'Demo User',
    reported_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hrs ago
    status: 'Pending Review',
    ai_confidence: 76,
  },
  {
    id: '5',
    incident_type: 'Dropped Glove',
    severity: 1,
    location: 'Pack House - Station 2',
    description: 'Blue nitrile glove found on bench - no contamination',
    reported_by: 'Demo User',
    reported_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hrs ago
    status: 'Dismissed',
    ai_confidence: 89,
  },
  {
    id: '6',
    incident_type: 'Fertigation Error',
    severity: 4,
    location: 'Control Room',
    description: 'Error code E-47 on fertigation controller',
    reported_by: 'Mike L.',
    reported_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hrs ago
    status: 'Resolved',
    routed_to: 'Maintenance Team',
    ai_confidence: 95,
  },
];

function IncidentHistoryTableComponent({
  sessionCode,
  onViewIncident,
  maxRows = 10,
}: IncidentHistoryTableProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'escalated' | 'resolved'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadIncidents();
  }, [sessionCode]);

  const loadIncidents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('session_code', sessionCode)
        .order('reported_at', { ascending: false })
        .limit(maxRows);

      if (error) {
        console.error('Error loading incidents:', error);
        setIncidents(SAMPLE_INCIDENTS);
      } else if (data && data.length > 0) {
        setIncidents(data as Incident[]);
      } else {
        // Use sample data for demo
        setIncidents(SAMPLE_INCIDENTS);
      }
    } catch (err) {
      console.error('Error:', err);
      setIncidents(SAMPLE_INCIDENTS);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'escalated':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ArrowUpRight className="w-3 h-3" />
            Escalated
          </span>
        );
      case 'in progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3" />
            In Progress
          </span>
        );
      case 'pending review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <Clock className="w-3 h-3" />
            Pending Review
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Resolved
          </span>
        );
      case 'dismissed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <XCircle className="w-3 h-3" />
            Dismissed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  const getSeverityBadge = (severity: number) => {
    const colors = {
      5: 'bg-red-500 text-white',
      4: 'bg-orange-500 text-white',
      3: 'bg-yellow-500 text-white',
      2: 'bg-blue-400 text-white',
      1: 'bg-gray-400 text-white',
    };
    return (
      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${colors[severity as keyof typeof colors] || colors[1]}`}>
        {severity}
      </span>
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  // Filter incidents
  const filteredIncidents = incidents.filter(incident => {
    // Status filter
    if (filter === 'open' && ['Resolved', 'Dismissed'].includes(incident.status)) return false;
    if (filter === 'escalated' && incident.status !== 'Escalated') return false;
    if (filter === 'resolved' && incident.status !== 'Resolved') return false;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        incident.incident_type.toLowerCase().includes(search) ||
        incident.location.toLowerCase().includes(search) ||
        incident.reported_by.toLowerCase().includes(search)
      );
    }

    return true;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Incident History
          </h3>
          <button
            onClick={loadIncidents}
            className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:border-bmf-blue focus:ring-1 focus:ring-bmf-blue outline-none"
            />
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            {(['all', 'open', 'escalated', 'resolved'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  filter === f
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Severity
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Type
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Location
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Routed To
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Reported
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredIncidents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  {isLoading ? 'Loading...' : 'No incidents found'}
                </td>
              </tr>
            ) : (
              filteredIncidents.map((incident) => (
                <tr
                  key={incident.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onViewIncident?.(incident)}
                >
                  <td className="px-4 py-3">
                    {getSeverityBadge(incident.severity)}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{incident.incident_type}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">
                        {incident.description}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {incident.location}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(incident.status)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {incident.routed_to || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-xs text-gray-500">{formatTime(incident.reported_at)}</p>
                      <p className="text-xs text-gray-400">{incident.reported_by}</p>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
        <span>{filteredIncidents.length} incidents shown</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {incidents.filter(i => i.status === 'Escalated').length} escalated
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            {incidents.filter(i => i.status === 'Pending Review').length} pending
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {incidents.filter(i => i.status === 'Resolved').length} resolved
          </span>
        </div>
      </div>
    </div>
  );
}

export const IncidentHistoryTable = memo(IncidentHistoryTableComponent);
