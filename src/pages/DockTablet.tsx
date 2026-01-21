import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { debug } from '../lib/debug';
import { Loader2, Package, Check, Truck, AlertTriangle, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface Shipment {
  shipment_id: string;
  product_name: string;
  sku: string;
  expected_qty: number;
  vendor: string;
  isReceived: boolean;
  receivedBy?: string;
  receivedAt?: string;
}

export function DockTablet() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receivingId, setReceivingId] = useState<string | null>(null);

  const fetchShipments = async () => {
    if (!sessionCode) return;

    try {
      // Fetch expected shipments and received status
      const [expectedRes, scansRes] = await Promise.all([
        supabase
          .from('shipments_expected')
          .select('shipment_id, vendor, expected_sku, expected_qty')
          .eq('session_code', sessionCode)
          .order('shipment_id'),
        supabase
          .from('barcode_scans')
          .select('shipment_id, scanned_by, scanned_at')
          .eq('session_code', sessionCode),
      ]);

      if (expectedRes.error) throw expectedRes.error;

      // Create map of received shipments
      const receivedMap = new Map(
        (scansRes.data || []).map(s => [s.shipment_id, { by: s.scanned_by, at: s.scanned_at }])
      );

      // Map to display format
      const mapped: Shipment[] = (expectedRes.data || []).map(s => ({
        shipment_id: s.shipment_id,
        product_name: getProductName(s.expected_sku),
        sku: s.expected_sku,
        expected_qty: s.expected_qty,
        vendor: s.vendor,
        isReceived: receivedMap.has(s.shipment_id),
        receivedBy: receivedMap.get(s.shipment_id)?.by,
        receivedAt: receivedMap.get(s.shipment_id)?.at,
      }));

      setShipments(mapped);
      setError(null);
    } catch (err) {
      debug.criticalError('Dock tablet fetch failed', err);
      setError('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();

    if (!sessionCode) return;

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`dock-${sessionCode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments_expected', filter: `session_code=eq.${sessionCode}` }, () => fetchShipments())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'barcode_scans', filter: `session_code=eq.${sessionCode}` }, () => fetchShipments())
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionCode]);

  const handleReceive = async (shipment: Shipment) => {
    if (shipment.isReceived || receivingId) return;

    setReceivingId(shipment.shipment_id);

    try {
      // Insert barcode scan record
      const { error: scanError } = await supabase.from('barcode_scans').insert({
        session_code: sessionCode,
        shipment_id: shipment.shipment_id,
        sku: shipment.sku,
        qty_scanned: shipment.expected_qty,
        scanned_by: 'Dock Tablet',
      });

      if (scanError) throw scanError;

      // Also insert into shipments_received
      const { error: receivedError } = await supabase.from('shipments_received').insert({
        session_code: sessionCode,
        shipment_id: shipment.shipment_id,
        received_qty: shipment.expected_qty,
        condition_notes: 'Received via Dock Tablet',
        received_by: 'Dock Worker',
      });

      if (receivedError) {
        debug.log('shipments_received insert failed (may already exist):', receivedError);
      }

      // Refresh will happen via realtime subscription
    } catch (err) {
      debug.criticalError('Receive failed', err);
      setError('Failed to record receipt');
    } finally {
      setReceivingId(null);
    }
  };

  // Helper to get product name from SKU
  const getProductName = (sku: string): string => {
    const productMap: Record<string, string> = {
      'PET-WAVE-606-PUR': 'Wave Petunia Purple',
      'PET-WAVE-606-PINK': 'Wave Petunia Pink',
      'PET-STVB-606-PINK': 'Supertunia Vista Bubblegum',
      'GER-ZON-45-RED': 'Zonal Geranium Red',
      'GER-IVY-HB10-MIX': 'Ivy Geranium Mix',
      'CAL-SBMG-1801-GRAPE': 'Superbells Magic Grapefruit',
      'TOM-CEL-1204': 'Celebrity Tomato',
      'BAS-SWT-804': 'Sweet Basil',
      'PET-WAVE-HB10-PUR': 'Wave Petunia Hanging',
      'IMP-SELF-606-MIX': 'Impatiens Mix',
      'TOM-CHER-804': 'Cherry Tomato',
      'PEP-BEL-804-MIX': 'Bell Pepper Mix',
    };
    return productMap[sku] || sku;
  };

  const pendingCount = shipments.filter(s => !s.isReceived).length;
  const receivedCount = shipments.filter(s => s.isReceived).length;

  if (!sessionCode) {
    return (
      <div className="min-h-screen bg-stone-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 shadow-lg text-center max-w-sm">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Invalid Session</h1>
          <p className="text-gray-600">No session code provided.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-bmf-blue to-bmf-blue-dark text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/20 rounded-xl">
              <Truck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Dock Receiving</h1>
              <p className="text-blue-100 text-sm">Session: {sessionCode}</p>
            </div>
          </div>
          <button
            onClick={() => fetchShipments()}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-stone-700 px-6 py-3 border-b border-stone-600">
        <div className="flex items-center justify-center gap-8 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-100 font-medium">{pendingCount} Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="text-green-100 font-medium">{receivedCount} Received</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-3 text-center">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && shipments.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      ) : (
        /* Shipment Cards */
        <div className="p-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shipments.map((shipment) => (
              <div
                key={shipment.shipment_id}
                className={`rounded-2xl overflow-hidden shadow-xl transition-all duration-300 ${
                  shipment.isReceived
                    ? 'bg-green-900/50 border-2 border-green-500/50'
                    : 'bg-stone-700 border-2 border-stone-600 hover:border-bmf-blue/50'
                }`}
              >
                {/* Card Header */}
                <div className={`px-5 py-4 ${
                  shipment.isReceived
                    ? 'bg-green-800/50'
                    : 'bg-stone-600'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className={`w-6 h-6 ${
                        shipment.isReceived ? 'text-green-300' : 'text-stone-300'
                      }`} />
                      <span className="font-bold text-white text-lg">{shipment.shipment_id}</span>
                    </div>
                    {shipment.isReceived && (
                      <div className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        <Check className="w-4 h-4" />
                        Received
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  <div className="flex gap-4">
                    {/* QR Code */}
                    <div className={`p-2 rounded-lg ${
                      shipment.isReceived ? 'bg-green-800/30' : 'bg-white'
                    }`}>
                      <QRCodeSVG
                        value={JSON.stringify({
                          sessionCode,
                          shipmentId: shipment.shipment_id,
                          sku: shipment.sku,
                          qty: shipment.expected_qty,
                        })}
                        size={80}
                        level="M"
                        fgColor={shipment.isReceived ? '#86efac' : '#1e293b'}
                        bgColor={shipment.isReceived ? 'transparent' : '#ffffff'}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-lg truncate">
                        {shipment.product_name}
                      </h3>
                      <p className="text-stone-400 text-sm">{shipment.sku}</p>
                      <p className="text-stone-400 text-sm mt-1">
                        From: {shipment.vendor}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-2xl font-bold text-white">
                          {shipment.expected_qty}
                        </span>
                        <span className="text-stone-400">units</span>
                      </div>
                    </div>
                  </div>

                  {/* Receive Button or Status */}
                  {shipment.isReceived ? (
                    <div className="mt-4 p-3 bg-green-800/30 rounded-xl text-center">
                      <p className="text-green-300 text-sm">
                        Received by {shipment.receivedBy}
                      </p>
                      {shipment.receivedAt && (
                        <p className="text-green-400/70 text-xs mt-1">
                          {new Date(shipment.receivedAt).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleReceive(shipment)}
                      disabled={receivingId === shipment.shipment_id}
                      className="mt-4 w-full py-4 bg-bmf-blue hover:bg-bmf-blue-dark disabled:bg-stone-600 text-white font-bold text-lg rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      {receivingId === shipment.shipment_id ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Receiving...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          RECEIVE SHIPMENT
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {shipments.length === 0 && !loading && (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-stone-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-stone-300 mb-2">No Shipments Expected</h2>
              <p className="text-stone-500">Add expected shipments to the PO to see them here.</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-stone-900/95 backdrop-blur border-t border-stone-700 px-6 py-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-stone-400 text-sm">
            Big Marble Farms - Dock Receiving Terminal
          </p>
        </div>
      </div>
    </div>
  );
}
