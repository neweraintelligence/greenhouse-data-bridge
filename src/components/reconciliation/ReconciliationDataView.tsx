import { useState, useEffect } from 'react';
import { Database, AlertTriangle, CheckCircle2, Users, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ReconciliationDataViewProps {
  sessionCode: string;
}

// The reconciled data from all 4 sources - with planted discrepancies
const RECONCILED_DATA = [
  {
    row: 1,
    reference: 'PO-2024-4521',
    email_vendor: "Nature's Pride Farms",
    po_vendor: "Nature's Pride Farms",
    invoice_vendor: "Natures Pride Farm", // DISCREPANCY
    receiving_vendor: "Nature's Pride Farms",
    product: 'Organic Roma Tomatoes',
    sku: 'TOM-ROM-5LB',
    ordered_qty: 200,
    received_qty: 200,
    unit_price: '$4.50',
    total: '$900.00',
    delivery_date: 'Jan 15, 2024',
    signed_by: 'J. Martinez',
    hasDiscrepancy: true,
    discrepancyType: 'Vendor name mismatch',
  },
  {
    row: 2,
    reference: 'PO-2024-4522',
    email_vendor: 'Valley Fresh Produce',
    po_vendor: 'Valley Fresh Produce',
    invoice_vendor: 'Valley Fresh Produce',
    receiving_vendor: 'Valley Fresh Produce',
    product: 'Green Bell Peppers',
    sku: 'PEP-GRN-1LB',
    ordered_qty: 500,
    received_qty: 498, // DISCREPANCY
    unit_price: '$2.25',
    total: '$1,125.00',
    delivery_date: 'Jan 15, 2024',
    signed_by: 'M. Chen',
    hasDiscrepancy: true,
    discrepancyType: 'Quantity shortage',
  },
  {
    row: 3,
    reference: 'PO-2024-4523',
    email_vendor: 'Sunrise Organics',
    po_vendor: 'Sunrise Organics',
    invoice_vendor: 'Sunrise Organics',
    receiving_vendor: 'Sunrise Organics',
    product: 'Organic Cherry Tomatoes',
    sku_po: 'TOM-ORG-1KG', // DISCREPANCY
    sku_bol: 'TOM-ORGANIC-1KG',
    ordered_qty: 300,
    received_qty: 300,
    unit_price: '$6.00',
    total: '$1,800.00',
    delivery_date: 'Jan 16, 2024',
    signed_by: 'R. Patel',
    hasDiscrepancy: true,
    discrepancyType: 'SKU format mismatch',
  },
  {
    row: 4,
    reference: 'SHP-0034',
    email_vendor: 'Green Valley Co-op',
    po_vendor: 'Green Valley Co-op',
    invoice_vendor: 'Green Valley Co-op',
    receiving_vendor: 'Green Valley Co-op',
    product: 'Mixed Salad Greens',
    sku: 'SAL-MIX-2LB',
    ordered_qty: 150,
    received_qty: 150,
    unit_price: '$8.00',
    total: '$1,200.00',
    expected_date: 'Jan 15, 2024', // DISCREPANCY
    actual_date: 'Jan 16, 2024',
    signed_by: 'A. Johnson',
    hasDiscrepancy: true,
    discrepancyType: 'Late delivery',
  },
  {
    row: 5,
    reference: 'SHP-0035',
    email_vendor: 'Farm Direct LLC',
    po_vendor: 'Farm Direct LLC',
    invoice_vendor: 'Farm Direct LLC',
    receiving_vendor: 'Farm Direct LLC',
    product: 'Organic Cucumbers',
    sku: 'CUC-ORG-1LB',
    ordered_qty: 400,
    received_qty: 400,
    unit_price: '$3.50',
    total: '$1,400.00',
    delivery_date: 'Jan 16, 2024',
    ship_to: '123 Main St, Warehouse A', // DISCREPANCY
    delivered_to: '123 Main Street, WH-A',
    signed_by: 'T. Williams',
    hasDiscrepancy: true,
    discrepancyType: 'Address format mismatch',
  },
];

interface ParticipantScore {
  name: string;
  correct: number;
  total: number;
}

export function ReconciliationDataView({ sessionCode }: ReconciliationDataViewProps) {
  const [participants, setParticipants] = useState<ParticipantScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sessionCode) return;

    loadParticipantScores();

    const channel = supabase
      .channel(`reconciliation-quiz-${sessionCode}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reconciliation_quiz_responses',
          filter: `session_code=eq.${sessionCode}`,
        },
        () => {
          loadParticipantScores();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionCode]);

  const loadParticipantScores = async () => {
    try {
      const { data } = await supabase
        .from('reconciliation_quiz_responses')
        .select('participant_name, is_correct')
        .eq('session_code', sessionCode);

      if (data) {
        const scoreMap = new Map<string, { correct: number; total: number }>();
        data.forEach((row) => {
          const existing = scoreMap.get(row.participant_name) || { correct: 0, total: 0 };
          scoreMap.set(row.participant_name, {
            correct: existing.correct + (row.is_correct ? 1 : 0),
            total: existing.total + 1,
          });
        });

        const scores: ParticipantScore[] = Array.from(scoreMap.entries())
          .map(([name, stats]) => ({ name, ...stats }))
          .sort((a, b) => (b.correct / b.total) - (a.correct / a.total));

        setParticipants(scores);
      }
    } catch (err) {
      console.error('Error loading scores:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-gray-700" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Reconciled Data</h2>
            <p className="text-sm text-gray-500">All sources normalized and merged</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            <span>{participants.length} participants</span>
          </div>
          <button onClick={loadParticipantScores} className="p-2 hover:bg-gray-100 rounded-lg">
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
          <span>Potential discrepancy</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3 h-3 text-green-600" />
          <span>Values match</span>
        </div>
      </div>

      {/* Data table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2.5 text-left font-medium text-gray-700">Row</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-700">Reference</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-700">Vendor (Email)</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-700">Vendor (PO)</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-700">Vendor (Invoice)</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-700">Product</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-700">SKU</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-700">Ordered</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-700">Received</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-700">Delivery</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {RECONCILED_DATA.map((row) => (
                <tr key={row.reference} className="hover:bg-gray-50">
                  <td className="px-3 py-2.5 font-mono text-gray-500">{row.row}</td>
                  <td className="px-3 py-2.5 font-mono font-medium text-gray-900">{row.reference}</td>

                  <td className="px-3 py-2.5 text-gray-700">{row.email_vendor}</td>
                  <td className="px-3 py-2.5 text-gray-700">{row.po_vendor}</td>
                  <td className={`px-3 py-2.5 ${
                    row.invoice_vendor !== row.po_vendor ? 'bg-amber-50 text-amber-900 font-medium' : 'text-gray-700'
                  }`}>
                    {row.invoice_vendor}
                  </td>

                  <td className="px-3 py-2.5 text-gray-700">{row.product}</td>

                  <td className={`px-3 py-2.5 ${row.sku_po ? 'bg-amber-50' : ''}`}>
                    {row.sku_po ? (
                      <div className="text-xs">
                        <div className="text-gray-500">PO: <span className="text-amber-900 font-medium">{row.sku_po}</span></div>
                        <div className="text-gray-500">BOL: <span className="text-amber-900 font-medium">{row.sku_bol}</span></div>
                      </div>
                    ) : (
                      <span className="text-gray-700">{row.sku}</span>
                    )}
                  </td>

                  <td className="px-3 py-2.5 text-right font-mono text-gray-700">{row.ordered_qty}</td>
                  <td className={`px-3 py-2.5 text-right font-mono ${
                    row.received_qty !== row.ordered_qty
                      ? 'bg-amber-50 text-amber-900 font-medium'
                      : 'text-gray-700'
                  }`}>
                    {row.received_qty}
                  </td>

                  <td className={`px-3 py-2.5 text-xs ${
                    (row.expected_date && row.actual_date && row.expected_date !== row.actual_date) ||
                    (row.ship_to && row.delivered_to && row.ship_to !== row.delivered_to)
                      ? 'bg-amber-50' : ''
                  }`}>
                    {row.expected_date ? (
                      <div>
                        <div className="text-gray-500">Exp: <span className="text-gray-700">{row.expected_date}</span></div>
                        <div className="text-gray-500">Act: <span className="text-amber-900 font-medium">{row.actual_date}</span></div>
                      </div>
                    ) : row.ship_to ? (
                      <div>
                        <div className="text-gray-500">To: <span className="text-gray-700">{row.ship_to}</span></div>
                        <div className="text-gray-500">At: <span className="text-amber-900 font-medium">{row.delivered_to}</span></div>
                      </div>
                    ) : (
                      <span className="text-gray-700">{row.delivery_date}</span>
                    )}
                  </td>

                  <td className="px-3 py-2.5">
                    {row.hasDiscrepancy ? (
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="text-xs text-gray-600">{row.discrepancyType}</span>
                      </div>
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Participant scores */}
      {participants.length > 0 && (
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Live Accuracy Scores</h3>
          <div className="flex flex-wrap gap-2">
            {participants.slice(0, 10).map((p) => {
              const pct = Math.round((p.correct / p.total) * 100);
              return (
                <div
                  key={p.name}
                  className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-sm"
                >
                  <span className="font-medium text-gray-700">{p.name}</span>
                  <span className="text-gray-400 mx-1.5">·</span>
                  <span className={`font-mono ${
                    pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI comparison */}
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div>
          <p className="text-sm font-medium text-gray-700">AI Detection</p>
          <p className="text-xs text-gray-500">Found all 5 discrepancies in 0.08 seconds</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-gray-900">100%</p>
          <p className="text-xs text-gray-500">Accuracy</p>
        </div>
      </div>
    </div>
  );
}
