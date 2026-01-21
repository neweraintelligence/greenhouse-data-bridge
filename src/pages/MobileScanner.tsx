import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Check, X, AlertTriangle, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { debug } from '../lib/debug';

export function MobileScanner() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const navigate = useNavigate();
  const [identity, setIdentity] = useState<{ name: string; role: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [scannedItems, setScannedItems] = useState<Array<{shipmentId: string; productName: string; qty: number; status: 'success' | 'error'; message: string}>>([]);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    // Check for identity - require participant to identify themselves
    const storedIdentity = sessionStorage.getItem('user_identity');
    if (storedIdentity) {
      setIdentity(JSON.parse(storedIdentity));
    } else {
      // Redirect to identity page
      navigate(`/identity?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // Initialize scanner
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop();
      }
    };
  }, [navigate]);

  const startScanning = async () => {
    if (!scannerRef.current) return;

    // Show loading state immediately - this also ensures the qr-reader div is visible
    setCameraStarting(true);
    setError(null);

    // Small delay to ensure the div is rendered and visible before starting scanner
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          try {
            // Parse QR data
            const data = JSON.parse(decodedText);

            // Validate it's for this session
            if (data.sessionCode !== sessionCode) {
              addScanResult(data.shipmentId || 'Unknown', data.productName || 'Unknown Product', 0, 'error', 'Wrong session - scan from your own screen');
              return;
            }

            // Validate against expected shipments
            const { data: expected } = await supabase
              .from('shipments_expected')
              .select('shipment_id, expected_sku, expected_qty')
              .eq('session_code', sessionCode)
              .eq('shipment_id', data.shipmentId)
              .single();

            if (!expected) {
              addScanResult(data.shipmentId, data.productName, data.qty, 'error', '⚠️ UNEXPECTED SHIPMENT - Not in order list');

              // Log as escalation
              await supabase.from('escalations').insert({
                session_code: sessionCode,
                source_type: 'scan_validation',
                source_id: data.shipmentId,
                severity: 'high',
                routed_to: 'Warehouse Supervisor',
                status: 'pending',
              });
              return;
            }

            if (expected.expected_sku !== data.sku) {
              addScanResult(data.shipmentId, data.productName, data.qty, 'error', `❌ WRONG PRODUCT! Expected ${expected.expected_sku}, got ${data.sku}`);

              // Log as escalation
              await supabase.from('escalations').insert({
                session_code: sessionCode,
                source_type: 'sku_mismatch',
                source_id: data.shipmentId,
                severity: 'critical',
                routed_to: 'Operations Manager',
                status: 'pending',
              });
              return;
            }

            // Check if this shipment was already scanned
            const { data: existingScan } = await supabase
              .from('barcode_scans')
              .select('scanned_by, scanned_at')
              .eq('session_code', sessionCode)
              .eq('shipment_id', data.shipmentId)
              .single();

            if (existingScan) {
              const scannedTime = new Date(existingScan.scanned_at).toLocaleTimeString();
              addScanResult(
                data.shipmentId,
                data.productName,
                data.qty,
                'error',
                `⚠️ ALREADY SCANNED by ${existingScan.scanned_by} at ${scannedTime}`
              );
              return;
            }

            // Insert scan to Supabase with participant attribution
            const scannerName = identity?.name
              ? `${identity.name}${identity.role ? ` (${identity.role})` : ''}`
              : 'Unknown Scanner';

            const { error: insertError } = await supabase.from('barcode_scans').insert({
              session_code: sessionCode,
              shipment_id: data.shipmentId,
              sku: data.sku,
              qty_scanned: data.qty,
              scanned_by: scannerName,
            });

            if (insertError) {
              addScanResult(data.shipmentId, data.productName, data.qty, 'error', 'Failed to save scan');
            } else {
              addScanResult(data.shipmentId, data.productName, data.qty, 'success', `✓ Validated! ${data.qty} units of ${data.sku}`);
            }

            // Brief pause before allowing next scan
            setTimeout(() => {
              // Ready for next scan
            }, 500);

          } catch (err) {
            debug.error('Error processing scan:', err);
            addScanResult('Unknown', 'Invalid QR Code', 0, 'error', 'Could not parse QR code');
          }
        },
        (errorMessage) => {
          // Scanning error - usually camera not found or permission denied
          debug.log('Scan error:', errorMessage);
        }
      );

      setIsScanning(true);
      setCameraReady(true);
      setCameraStarting(false);
    } catch (err) {
      debug.criticalError('Scanner start failed', err);
      setError('Camera access denied or not available. Please allow camera access and try again.');
      setCameraReady(false);
      setCameraStarting(false);
    }
  };

  const stopScanning = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop();
      setIsScanning(false);
    }
  };

  const addScanResult = (shipmentId: string, productName: string, qty: number, status: 'success' | 'error', message: string) => {
    setScannedItems(prev => [{
      shipmentId,
      productName,
      qty,
      status,
      message,
    }, ...prev].slice(0, 10)); // Keep last 10 scans
  };

  if (!sessionCode) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 shadow-lg text-center max-w-sm w-full">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Invalid Session</h1>
          <p className="text-gray-600">
            Please scan the QR code from the Barcode Log node to start scanning.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bmf-blue to-bmf-blue-dark p-4">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 mb-4 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <img src="/bmf-logo.png" alt="BMF" className="h-10" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Barcode Scanner</h1>
            <p className="text-sm text-gray-600">Session: <code className="font-mono">{sessionCode}</code></p>
            {identity && (
              <p className="text-sm text-gray-600">
                Scanning as: <strong>{identity.name}</strong>
                {identity.role && ` (${identity.role})`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Scanner area */}
      <div className="bg-white rounded-2xl p-6 mb-4 shadow-lg">
        {/*
          IMPORTANT: The qr-reader div must be visible with dimensions when scanner.start() is called.
          We show it when camera is starting OR when actively scanning.
          The div needs explicit dimensions for the html5-qrcode library to work properly.
        */}
        <div
          id="qr-reader"
          className="w-full rounded-xl overflow-hidden"
          style={{
            display: (cameraStarting || isScanning) ? 'block' : 'none',
            minHeight: '300px',
            backgroundColor: '#000',
          }}
        />

        {/* Loading state while camera initializes */}
        {cameraStarting && !isScanning && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 border-4 border-bmf-blue/30 border-t-bmf-blue rounded-full animate-spin mb-4" />
            <p className="text-gray-600">Starting camera...</p>
            <p className="text-xs text-gray-400 mt-2">Please allow camera access when prompted</p>
          </div>
        )}

        {/* Initial state - show Start Camera button */}
        {!cameraReady && !cameraStarting && (
          <div className="text-center py-12">
            <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-6">Ready to scan shipping labels</p>
            <button
              onClick={startScanning}
              className="px-8 py-4 rounded-2xl bg-bmf-blue hover:bg-bmf-blue-dark text-white font-semibold transition-all shadow-lg flex items-center gap-2 mx-auto"
            >
              <Camera className="w-5 h-5" />
              Start Camera
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-100 border border-red-300 text-red-700 flex items-start gap-3 mt-4">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">{error}</p>
              <button
                onClick={startScanning}
                className="mt-2 text-sm underline text-red-700 hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {isScanning && (
          <div className="mt-4 text-center">
            <button
              onClick={stopScanning}
              className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors"
            >
              Stop Scanning
            </button>
          </div>
        )}
      </div>

      {/* Scanned items log */}
      {scannedItems.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Recent Scans ({scannedItems.length})
          </h2>
          <div className="space-y-2">
            {scannedItems.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border-2 ${
                  item.status === 'success'
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {item.status === 'success' ? (
                    <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.shipmentId}</p>
                    <p className="text-sm text-gray-700">{item.productName}</p>
                    <p className="text-sm text-gray-600">{item.qty} units</p>
                    <p className="text-xs text-gray-500 mt-1 italic">{item.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
