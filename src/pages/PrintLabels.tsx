import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PrintableLabels } from '../components/PrintableLabels';
import { supabase } from '../lib/supabase';
import { debug } from '../lib/debug';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface ShipmentWithStatus {
  shipment_id: string;
  product_name: string;
  sku: string;
  expected_qty: number;
  isScanned: boolean;
  isReceived: boolean;
}

export function PrintLabels() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const [shipments, setShipments] = useState<ShipmentWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShipments = async () => {
    if (!sessionCode) return;

    setLoading(true);
    try {
      // Fetch all data in parallel
      const [expectedRes, scansRes, receivedRes] = await Promise.all([
        supabase
          .from('shipments_expected')
          .select('shipment_id, vendor, expected_sku, expected_qty')
          .eq('session_code', sessionCode),
        supabase
          .from('barcode_scans')
          .select('shipment_id')
          .eq('session_code', sessionCode),
        supabase
          .from('shipments_received')
          .select('shipment_id')
          .eq('session_code', sessionCode),
      ]);

      if (expectedRes.error) throw expectedRes.error;

      // Create sets for quick lookup
      const scannedIds = new Set((scansRes.data || []).map(s => s.shipment_id));
      const receivedIds = new Set((receivedRes.data || []).map(r => r.shipment_id));

      // Map to printable format with status
      const mapped: ShipmentWithStatus[] = (expectedRes.data || []).map(s => ({
        shipment_id: s.shipment_id,
        product_name: getProductName(s.expected_sku),
        sku: s.expected_sku,
        expected_qty: s.expected_qty,
        isScanned: scannedIds.has(s.shipment_id),
        isReceived: receivedIds.has(s.shipment_id),
      }));

      setShipments(mapped);
    } catch (err) {
      debug.criticalError('Shipments fetch failed for labels', err);
      setError('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();

    // Subscribe to realtime updates
    if (!sessionCode) return;

    const channel = supabase
      .channel(`labels-${sessionCode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments_expected', filter: `session_code=eq.${sessionCode}` }, () => fetchShipments())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'barcode_scans', filter: `session_code=eq.${sessionCode}` }, () => fetchShipments())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments_received', filter: `session_code=eq.${sessionCode}` }, () => fetchShipments())
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionCode]);

  // Helper to get product name from SKU (realistic greenhouse products)
  const getProductName = (sku: string): string => {
    const productMap: Record<string, string> = {
      // Outbound - Bedding Plants
      'PET-WAVE-606-PUR': 'Wave Petunia Purple (606 pack)',
      'PET-WAVE-606-PINK': 'Wave Petunia Pink (606 pack)',
      'PET-STVB-606-PINK': 'Supertunia Vista Bubblegum - PINK (606 pack)',
      'PET-STVB-606-PUR': 'Supertunia Vista Bubblegum - PURPLE (606 pack)', // Wrong color variant
      'GER-ZON-45-RED': 'Zonal Geranium Red (4.5" pot)',
      'GER-IVY-HB10-MIX': 'Ivy Geranium Mix (10" hanging basket)',
      'CAL-SBMG-1801-GRAPE': 'Superbells Magic Grapefruit (1801 pack)',
      'TOM-CEL-1204': 'Celebrity Tomato (1204 pack)',
      'BAS-SWT-804': 'Sweet Basil (804 pack)',
      'PET-WAVE-HB10-PUR': 'Wave Petunia Purple (10" hanging basket)',
      'PER-ECHPW-1GAL': 'Echinacea PowWow (1-gallon)',

      // Inbound - Supplies
      'PLUG-288-PETWAVE': 'Petunia Wave Plugs (288-cell tray)',
      'PLUG-288-TOMBF': 'Tomato Big Beef Plugs (288-cell tray)',
      'SUNGRO-PROF-3CF': 'Sun Gro Professional Mix (3 cu ft bag)',
      'JACK-201020-25LB': 'Jack\'s 20-10-20 Fertilizer (25 lb bag)',
      'INS-606-225': '606 Insert Trays (2.25" deep)',
    };
    return productMap[sku] || sku;
  };

  // Stats
  const unscannedCount = shipments.filter(s => !s.isScanned).length;
  const unreceivedCount = shipments.filter(s => !s.isReceived).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-bmf-blue mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading shipment data...</p>
        </div>
      </div>
    );
  }

  if (error || !sessionCode) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600">{error || 'Invalid session'}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Status bar - not printed */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-6">
            <div className="text-sm">
              <span className="text-gray-500">Total:</span>{' '}
              <span className="font-semibold">{shipments.length}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Not scanned:</span>{' '}
              <span className="font-semibold text-amber-600">{unscannedCount}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Not received:</span>{' '}
              <span className="font-semibold text-blue-600">{unreceivedCount}</span>
            </div>
          </div>
          <button
            onClick={fetchShipments}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <PrintableLabels sessionCode={sessionCode} shipments={shipments} />
    </div>
  );
}
