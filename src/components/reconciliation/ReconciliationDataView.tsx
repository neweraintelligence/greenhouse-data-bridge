import { useState, useEffect } from 'react';
import { Database, AlertTriangle, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ReconciliationDataViewProps {
  sessionCode: string;
}

interface ExpectedShipment {
  shipment_id: string;
  expected_qty: number;
  expected_sku: string;
  vendor: string;
  ship_date: string;
}

interface BarcodeScan {
  shipment_id: string;
  qty_scanned: number;
  sku: string;
  scanned_by: string;
  scanned_at: string;
}

interface ReceivedShipment {
  shipment_id: string;
  received_qty: number;
  condition: string;
  receiver_name: string;
  received_at: string;
  reconciled: boolean;
}

interface MergedRecord {
  shipment_id: string;
  // Expected (from PO/Excel)
  expected_qty: number | null;
  expected_sku: string | null;
  vendor: string | null;
  ship_date: string | null;
  // Scanned (from barcode)
  scanned_qty: number | null;
  scanned_sku: string | null;
  scanned_by: string | null;
  scanned_at: string | null;
  // Received (from signature)
  received_qty: number | null;
  condition: string | null;
  receiver_name: string | null;
  received_at: string | null;
  // Discrepancy flags
  hasQtyDiscrepancy: boolean;
  hasSkuDiscrepancy: boolean;
  hasConditionIssue: boolean;
  isMissingData: boolean;
}

export function ReconciliationDataView({ sessionCode }: ReconciliationDataViewProps) {
  const [mergedData, setMergedData] = useState<MergedRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, clean: 0, flagged: 0 });

  const loadData = async () => {
    if (!sessionCode) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Fetch all 3 sources in parallel
      const [expectedRes, scannedRes, receivedRes] = await Promise.all([
        supabase.from('shipments_expected').select('*').eq('session_code', sessionCode),
        supabase.from('barcode_scans').select('*').eq('session_code', sessionCode),
        supabase.from('shipments_received').select('*').eq('session_code', sessionCode),
      ]);

      const expected: ExpectedShipment[] = expectedRes.data || [];
      const scanned: BarcodeScan[] = scannedRes.data || [];
      const received: ReceivedShipment[] = receivedRes.data || [];

      // Create a map of all unique shipment IDs
      const shipmentIds = new Set<string>();
      expected.forEach(e => shipmentIds.add(e.shipment_id));
      scanned.forEach(s => shipmentIds.add(s.shipment_id));
      received.forEach(r => shipmentIds.add(r.shipment_id));

      // Merge the data
      const merged: MergedRecord[] = Array.from(shipmentIds).map(shipmentId => {
        const exp = expected.find(e => e.shipment_id === shipmentId);
        const scan = scanned.find(s => s.shipment_id === shipmentId);
        const recv = received.find(r => r.shipment_id === shipmentId);

        // Determine discrepancies
        const hasQtyDiscrepancy =
          (exp && scan && exp.expected_qty !== scan.qty_scanned) ||
          (scan && recv && scan.qty_scanned !== recv.received_qty) ||
          (exp && recv && exp.expected_qty !== recv.received_qty);

        const hasSkuDiscrepancy =
          (exp && scan && exp.expected_sku !== scan.sku);

        const hasConditionIssue =
          recv?.condition && recv.condition !== 'Good condition';

        const isMissingData = !exp || !scan || !recv;

        return {
          shipment_id: shipmentId,
          // Expected
          expected_qty: exp?.expected_qty ?? null,
          expected_sku: exp?.expected_sku ?? null,
          vendor: exp?.vendor ?? null,
          ship_date: exp?.ship_date ?? null,
          // Scanned
          scanned_qty: scan?.qty_scanned ?? null,
          scanned_sku: scan?.sku ?? null,
          scanned_by: scan?.scanned_by ?? null,
          scanned_at: scan?.scanned_at ?? null,
          // Received
          received_qty: recv?.received_qty ?? null,
          condition: recv?.condition ?? null,
          receiver_name: recv?.receiver_name ?? null,
          received_at: recv?.received_at ?? null,
          // Flags
          hasQtyDiscrepancy: !!hasQtyDiscrepancy,
          hasSkuDiscrepancy: !!hasSkuDiscrepancy,
          hasConditionIssue: !!hasConditionIssue,
          isMissingData,
        };
      });

      // Sort by shipment ID
      merged.sort((a, b) => a.shipment_id.localeCompare(b.shipment_id));

      setMergedData(merged);

      // Calculate stats
      const flagged = merged.filter(r =>
        r.hasQtyDiscrepancy || r.hasSkuDiscrepancy || r.hasConditionIssue || r.isMissingData
      ).length;
      setStats({
        total: merged.length,
        clean: merged.length - flagged,
        flagged,
      });
    } catch (err) {
      console.error('Error loading reconciliation data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates
    if (!sessionCode) return;

    const channel = supabase
      .channel(`reconciliation-data-${sessionCode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments_expected', filter: `session_code=eq.${sessionCode}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'barcode_scans', filter: `session_code=eq.${sessionCode}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments_received', filter: `session_code=eq.${sessionCode}` }, () => loadData())
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionCode]);

  const hasAnyDiscrepancy = (record: MergedRecord) =>
    record.hasQtyDiscrepancy || record.hasSkuDiscrepancy || record.hasConditionIssue || record.isMissingData;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-gray-700" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Reconciled Data</h2>
            <p className="text-sm text-gray-500">All sources merged by Shipment ID</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-xl font-semibold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-green-600">{stats.clean}</p>
              <p className="text-xs text-gray-500">Clean</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-amber-600">{stats.flagged}</p>
              <p className="text-xs text-gray-500">Flagged</p>
            </div>
          </div>
          <button onClick={loadData} className="p-2 hover:bg-gray-100 rounded-lg">
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
          <span>Discrepancy detected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300" />
          <span>Missing data</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3 h-3 text-green-600" />
          <span>All sources match</span>
        </div>
      </div>

      {/* Data table */}
      {mergedData.length === 0 ? (
        <div className="text-center py-12 border border-gray-200 rounded-lg bg-gray-50">
          <Database className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No data yet</p>
          <p className="text-sm text-gray-400 mt-1">Data will appear as participants enter information</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2.5 text-left font-medium text-gray-700" rowSpan={2}>Shipment ID</th>
                  <th className="px-3 py-2.5 text-center font-medium text-gray-700 border-l border-gray-200" colSpan={3}>
                    <span className="text-blue-600">Expected (PO/Excel)</span>
                  </th>
                  <th className="px-3 py-2.5 text-center font-medium text-gray-700 border-l border-gray-200" colSpan={3}>
                    <span className="text-purple-600">Scanned (Barcode)</span>
                  </th>
                  <th className="px-3 py-2.5 text-center font-medium text-gray-700 border-l border-gray-200" colSpan={3}>
                    <span className="text-emerald-600">Received (Signature)</span>
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-700 border-l border-gray-200" rowSpan={2}>Status</th>
                </tr>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs">
                  <th className="px-3 py-1.5 text-left font-medium text-gray-500 border-l border-gray-200">SKU</th>
                  <th className="px-3 py-1.5 text-right font-medium text-gray-500">Qty</th>
                  <th className="px-3 py-1.5 text-left font-medium text-gray-500">Vendor</th>
                  <th className="px-3 py-1.5 text-left font-medium text-gray-500 border-l border-gray-200">SKU</th>
                  <th className="px-3 py-1.5 text-right font-medium text-gray-500">Qty</th>
                  <th className="px-3 py-1.5 text-left font-medium text-gray-500">Scanned By</th>
                  <th className="px-3 py-1.5 text-right font-medium text-gray-500 border-l border-gray-200">Qty</th>
                  <th className="px-3 py-1.5 text-left font-medium text-gray-500">Condition</th>
                  <th className="px-3 py-1.5 text-left font-medium text-gray-500">Signed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mergedData.map((record) => (
                  <tr key={record.shipment_id} className={`hover:bg-gray-50 ${hasAnyDiscrepancy(record) ? 'bg-amber-50/50' : ''}`}>
                    {/* Shipment ID */}
                    <td className="px-3 py-2.5 font-mono font-medium text-gray-900">
                      {record.shipment_id}
                    </td>

                    {/* Expected (PO/Excel) */}
                    <td className={`px-3 py-2.5 border-l border-gray-200 ${
                      record.hasSkuDiscrepancy ? 'bg-amber-100 text-amber-900 font-medium' :
                      record.expected_sku === null ? 'bg-gray-100 text-gray-400 italic' : 'text-gray-700'
                    }`}>
                      {record.expected_sku ?? 'Missing'}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono ${
                      record.hasQtyDiscrepancy && record.expected_qty !== null ? 'bg-amber-100 text-amber-900 font-medium' :
                      record.expected_qty === null ? 'bg-gray-100 text-gray-400 italic' : 'text-gray-700'
                    }`}>
                      {record.expected_qty ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">
                      {record.vendor ?? '—'}
                    </td>

                    {/* Scanned (Barcode) */}
                    <td className={`px-3 py-2.5 border-l border-gray-200 ${
                      record.hasSkuDiscrepancy ? 'bg-amber-100 text-amber-900 font-medium' :
                      record.scanned_sku === null ? 'bg-gray-100 text-gray-400 italic' : 'text-gray-700'
                    }`}>
                      {record.scanned_sku ?? 'Not scanned'}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono ${
                      record.hasQtyDiscrepancy && record.scanned_qty !== null ? 'bg-amber-100 text-amber-900 font-medium' :
                      record.scanned_qty === null ? 'bg-gray-100 text-gray-400 italic' : 'text-gray-700'
                    }`}>
                      {record.scanned_qty ?? '—'}
                    </td>
                    <td className={`px-3 py-2.5 text-xs ${
                      record.scanned_by === null ? 'bg-gray-100 text-gray-400 italic' : 'text-gray-600'
                    }`}>
                      {record.scanned_by ?? '—'}
                    </td>

                    {/* Received (Signature) */}
                    <td className={`px-3 py-2.5 text-right font-mono border-l border-gray-200 ${
                      record.hasQtyDiscrepancy && record.received_qty !== null ? 'bg-amber-100 text-amber-900 font-medium' :
                      record.received_qty === null ? 'bg-gray-100 text-gray-400 italic' : 'text-gray-700'
                    }`}>
                      {record.received_qty ?? '—'}
                    </td>
                    <td className={`px-3 py-2.5 text-xs ${
                      record.hasConditionIssue ? 'bg-amber-100 text-amber-900 font-medium' :
                      record.condition === null ? 'bg-gray-100 text-gray-400 italic' : 'text-gray-600'
                    }`}>
                      {record.condition ?? 'Not received'}
                    </td>
                    <td className={`px-3 py-2.5 text-xs ${
                      record.receiver_name === null ? 'bg-gray-100 text-gray-400 italic' : 'text-gray-600'
                    }`}>
                      {record.receiver_name ?? '—'}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5 border-l border-gray-200">
                      {hasAnyDiscrepancy(record) ? (
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span className="text-xs text-gray-600">
                            {record.isMissingData ? 'Incomplete' :
                             record.hasSkuDiscrepancy ? 'SKU mismatch' :
                             record.hasQtyDiscrepancy ? 'Qty mismatch' :
                             record.hasConditionIssue ? 'Condition issue' : 'Issue'}
                          </span>
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
      )}

      {/* AI processing note */}
      {mergedData.length > 0 && (
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div>
            <p className="text-sm font-medium text-gray-700">AI Processing</p>
            <p className="text-xs text-gray-500">Merged {stats.total} records from 3 sources, flagged {stats.flagged} discrepancies</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-gray-900">{stats.total > 0 ? Math.round((stats.clean / stats.total) * 100) : 0}%</p>
            <p className="text-xs text-gray-500">Match rate</p>
          </div>
        </div>
      )}
    </div>
  );
}
