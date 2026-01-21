import { memo, useState, useEffect } from 'react';
import { ScanBarcode, Tag, Check, CheckCheck, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../../../lib/supabase';

interface ScanEntry {
  code: string;
  time: string;
  type: string;
  sku: string;
  scannedBy?: string;
}

interface ShipmentLabel {
  shipment_id: string;
  product_name: string;
  sku: string;
  expected_qty: number;
  isScanned: boolean;
  isReceived: boolean;
}

interface BarcodeScanMiniAppProps {
  sessionCode: string;
  // Optional: pre-loaded scan data
  scans?: ScanEntry[];
  // When true, renders in expanded/maximized layout
  expanded?: boolean;
}

// Map SKU to product name
function getProductName(sku: string): string {
  const productMap: Record<string, string> = {
    // Outbound - Bedding Plants
    'PET-WAVE-606-PUR': 'Wave Petunia Purple',
    'PET-WAVE-606-PINK': 'Wave Petunia Pink',
    'PET-STVB-606-PINK': 'Supertunia Vista Bubblegum',
    'GER-ZON-45-RED': 'Zonal Geranium Red',
    'GER-IVY-HB10-MIX': 'Ivy Geranium Mix',
    'CAL-SBMG-1801-GRAPE': 'Superbells Magic Grapefruit',
    'TOM-CEL-1204': 'Celebrity Tomato',
    'BAS-SWT-804': 'Sweet Basil',
    // Inbound
    'PLUG-288-PETWAVE': 'Petunia Wave Plugs',
    'PLUG-288-TOMBF': 'Tomato Plugs',
    'SUNGRO-PROF-3CF': 'Sun Gro Mix',
    'JACK-201020-25LB': 'Jacks Fertilizer',
    'CTN-12OZ': 'Greenhouse Cartons',
    'BAG-2LB': 'Herb Bags',
  };
  return productMap[sku] || sku;
}

function BarcodeScanMiniAppComponent({ sessionCode, scans: initialScans, expanded = false }: BarcodeScanMiniAppProps) {
  const [activeTab, setActiveTab] = useState<'scans' | 'labels'>('scans');
  const [shipments, setShipments] = useState<ShipmentLabel[]>([]);
  const [scans, setScans] = useState<ScanEntry[]>(initialScans || [
    { code: 'SHP-2025-0001', time: '10:42 AM', type: 'Shipment', sku: 'SKU-3382' },
    { code: 'PLT-8847-A', time: '10:38 AM', type: 'Pallet', sku: 'SKU-1247' },
    { code: 'SHP-2025-0002', time: '10:35 AM', type: 'Shipment', sku: 'SKU-5891' },
    { code: 'BOX-44521', time: '10:31 AM', type: 'Box', sku: 'SKU-7733' },
  ]);
  const [loading, setLoading] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Fetch shipments and scan status
  useEffect(() => {
    if (activeTab !== 'labels') return;

    const fetchData = async () => {
      setLoading(true);
      try {
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

        const scannedIds = new Set((scansRes.data || []).map(s => s.shipment_id));
        const receivedIds = new Set((receivedRes.data || []).map(r => r.shipment_id));

        const mapped: ShipmentLabel[] = (expectedRes.data || []).map(s => ({
          shipment_id: s.shipment_id,
          product_name: getProductName(s.expected_sku),
          sku: s.expected_sku,
          expected_qty: s.expected_qty,
          isScanned: scannedIds.has(s.shipment_id),
          isReceived: receivedIds.has(s.shipment_id),
        }));

        setShipments(mapped);
      } catch (err) {
        console.error('Failed to fetch shipments for labels:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`barcode-labels-${sessionCode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments_expected', filter: `session_code=eq.${sessionCode}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'barcode_scans', filter: `session_code=eq.${sessionCode}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments_received', filter: `session_code=eq.${sessionCode}` }, () => fetchData())
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionCode, activeTab]);

  // Subscribe to barcode scans for the scans tab
  useEffect(() => {
    if (activeTab !== 'scans') return;

    const fetchScans = async () => {
      const { data } = await supabase
        .from('barcode_scans')
        .select('shipment_id, sku, qty_scanned, scanned_at, scanned_by')
        .eq('session_code', sessionCode)
        .order('scanned_at', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        const newScans: ScanEntry[] = data.map(s => ({
          code: s.shipment_id,
          time: new Date(s.scanned_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          type: 'Shipment',
          sku: s.sku,
          scannedBy: s.scanned_by,
        }));
        setScans(newScans);
      }
    };

    fetchScans();

    const channel = supabase
      .channel(`barcode-scans-${sessionCode}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'barcode_scans', filter: `session_code=eq.${sessionCode}` }, () => fetchScans())
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionCode, activeTab]);

  return (
    <div className="space-y-2">
      {/* Tab toggle */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setActiveTab('scans')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'scans'
              ? 'bg-white shadow-sm text-gray-900'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <ScanBarcode className="w-3 h-3" />
          <span>Scan Log</span>
        </button>
        <button
          onClick={() => setActiveTab('labels')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'labels'
              ? 'bg-white shadow-sm text-gray-900'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Tag className="w-3 h-3" />
          <span>Labels</span>
        </button>
      </div>

      {/* Scans tab content */}
      {activeTab === 'scans' && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <ScanBarcode className="w-3 h-3" />
            <span>Recent scans</span>
            {scans.length > 0 && (
              <span className="ml-auto text-[9px] text-gray-400">{scans.length} entries</span>
            )}
          </div>
          <div className={`space-y-1.5 overflow-y-auto ${expanded ? 'max-h-[500px]' : 'max-h-[300px]'}`}>
            {scans.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs">
                <ScanBarcode className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No scans yet</p>
                <p className="text-[10px]">Scan shipping labels to see them here</p>
              </div>
            ) : scans.map((entry, i) => (
              <div key={i} className={`flex items-start justify-between rounded-lg border border-gray-200 bg-white shadow-sm ${expanded ? 'p-3' : 'p-2'}`}>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <code className={`font-mono text-gray-900 font-semibold ${expanded ? 'text-sm' : 'text-[11px]'}`}>{entry.code}</code>
                    <span className={`px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium ${expanded ? 'text-[10px]' : 'text-[9px]'}`}>
                      {entry.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className={`font-mono text-gray-500 ${expanded ? 'text-xs' : 'text-[10px]'}`}>{entry.sku}</code>
                    {entry.scannedBy && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className={`text-gray-600 ${expanded ? 'text-xs' : 'text-[10px]'}`}>
                          by <span className="font-medium">{entry.scannedBy}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <span className={`text-gray-400 whitespace-nowrap ${expanded ? 'text-xs' : 'text-[10px]'}`}>{entry.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Labels tab content */}
      {activeTab === 'labels' && (
        <div className="space-y-2 relative">
          {/* Box background for expanded labels view */}
          {expanded && (
            <div
              className="absolute inset-0 -m-6 pointer-events-none overflow-hidden rounded-b-2xl"
              style={{ opacity: 0.7 }}
            >
              <img
                src="/demo_pack/use_case_images/clean_shipping_box_side_profile.png"
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className={`flex items-center gap-1.5 text-[10px] text-gray-500 relative z-10 ${expanded ? 'bg-white/90 -mx-2 px-2 py-1 rounded-lg' : ''}`}>
            <Tag className="w-3 h-3" />
            <span>Shipping Labels</span>
            {shipments.length > 0 && (
              <span className="ml-auto text-[9px] text-gray-400">
                {shipments.filter(s => s.isScanned).length}/{shipments.length} scanned
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 relative z-10">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-xs relative z-10">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No shipments found</p>
              <p className="text-[10px]">Add expected shipments first</p>
            </div>
          ) : expanded ? (
            /* EXPANDED VIEW: Carousel with one large label at a time */
            (() => {
              const scannedCount = shipments.filter(s => s.isScanned || s.isReceived).length;
              const remainingCount = shipments.length - scannedCount;
              const currentShipment = shipments[carouselIndex];

              if (!currentShipment) return null;

              const qrData = JSON.stringify({
                sessionCode,
                shipmentId: currentShipment.shipment_id,
                sku: currentShipment.sku,
                productName: currentShipment.product_name,
                qty: currentShipment.expected_qty,
                timestamp: new Date().toISOString(),
              });

              const statusBorder = currentShipment.isReceived
                ? 'border-emerald-400'
                : currentShipment.isScanned
                ? 'border-amber-400'
                : 'border-gray-300';

              return (
                <div className="flex flex-col items-center relative z-10">
                  {/* Progress summary bar */}
                  <div className="w-full flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                        <CheckCheck className="w-4 h-4" />
                        {scannedCount} scanned
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                        <Package className="w-4 h-4" />
                        {remainingCount} remaining
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {carouselIndex + 1} of {shipments.length}
                    </span>
                  </div>

                  {/* Carousel with navigation */}
                  <div className="flex items-center gap-4 py-2">
                      {/* Left arrow */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setCarouselIndex(Math.max(0, carouselIndex - 1));
                        }}
                        disabled={carouselIndex === 0}
                        className={`p-3 rounded-full transition-all ${
                          carouselIndex === 0
                            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                        }`}
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>

                      {/* Large portrait label card */}
                      <div
                        className={`bg-white rounded-2xl border-2 ${statusBorder} shadow-lg overflow-hidden w-[280px]`}
                      >
                      {/* Label header */}
                      <div className="bg-gray-900 text-white px-3 py-2 text-center">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Big Marble Farms</p>
                        <p className="font-mono font-bold text-base">{currentShipment.shipment_id}</p>
                      </div>

                      {/* Product info */}
                      <div className="px-3 py-2 border-b border-gray-100 text-center bg-gray-50">
                        <p className="font-semibold text-gray-800 text-sm leading-tight">{currentShipment.product_name}</p>
                        <p className="font-mono text-xs text-gray-500 mt-0.5">{currentShipment.sku}</p>
                      </div>

                      {/* Large QR Code - Scannable */}
                      <div className="flex items-center justify-center p-4 bg-white">
                        <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                          <QRCodeSVG
                            value={qrData}
                            size={180}
                            level="M"
                            includeMargin={false}
                          />
                        </div>
                      </div>

                      {/* Quantity and status footer */}
                      <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Qty</p>
                            <p className="font-bold text-xl text-gray-800">{currentShipment.expected_qty}</p>
                          </div>
                          {currentShipment.isReceived ? (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                              <CheckCheck className="w-3.5 h-3.5" />
                              Received
                            </span>
                          ) : currentShipment.isScanned ? (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                              <Check className="w-3.5 h-3.5" />
                              Scanned
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                              <Package className="w-3.5 h-3.5" />
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                      {/* Right arrow */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setCarouselIndex(Math.min(shipments.length - 1, carouselIndex + 1));
                        }}
                        disabled={carouselIndex === shipments.length - 1}
                        className={`p-3 rounded-full transition-all ${
                          carouselIndex === shipments.length - 1
                            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                        }`}
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </div>

                  {/* Dot indicators */}
                  <div className="flex items-center gap-2 mt-2">
                    {shipments.map((s, i) => (
                      <button
                        key={s.shipment_id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCarouselIndex(i);
                        }}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          i === carouselIndex
                            ? 'bg-gray-800 scale-110'
                            : s.isReceived || s.isScanned
                            ? 'bg-emerald-400'
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })()
          ) : (
            /* COMPACT VIEW: Original small inline cards */
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {shipments.map((shipment) => {
                const qrData = JSON.stringify({
                  sessionCode,
                  shipmentId: shipment.shipment_id,
                  sku: shipment.sku,
                  productName: shipment.product_name,
                  qty: shipment.expected_qty,
                  timestamp: new Date().toISOString(),
                });

                const statusClass = shipment.isReceived
                  ? 'border-emerald-300 bg-emerald-50'
                  : shipment.isScanned
                  ? 'border-amber-300 bg-amber-50'
                  : 'border-gray-200 bg-gray-50';

                return (
                  <div
                    key={shipment.shipment_id}
                    className={`p-2 rounded-lg border ${statusClass} transition-colors`}
                  >
                    <div className="flex items-start gap-2">
                      {/* Mini QR code */}
                      <div className="bg-white p-1 rounded shadow-sm flex-shrink-0">
                        <QRCodeSVG
                          value={qrData}
                          size={48}
                          level="M"
                          includeMargin={false}
                        />
                      </div>

                      {/* Shipment info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-[11px] text-gray-800">
                            {shipment.shipment_id}
                          </span>
                          {shipment.isReceived ? (
                            <span className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-semibold bg-emerald-500 text-white">
                              <CheckCheck className="w-2.5 h-2.5" />
                              Done
                            </span>
                          ) : shipment.isScanned ? (
                            <span className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-semibold bg-amber-500 text-white">
                              <Check className="w-2.5 h-2.5" />
                              Scanned
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[10px] text-gray-600 truncate">{shipment.product_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <code className="text-[9px] text-gray-500">{shipment.sku}</code>
                          <span className="text-[9px] text-gray-400">|</span>
                          <span className="text-[9px] text-gray-500">{shipment.expected_qty} units</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Help text */}
          <p className={`text-gray-400 text-center pt-1 relative z-10 ${expanded ? 'text-xs bg-white/80 mx-auto px-3 py-1 rounded-lg w-fit' : 'text-[9px]'}`}>
            Scan QR codes with phone to log shipments
          </p>
        </div>
      )}
    </div>
  );
}

export const BarcodeScanMiniApp = memo(BarcodeScanMiniAppComponent);
