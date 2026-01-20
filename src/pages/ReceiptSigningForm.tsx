import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ReceiptSigningForm() {
  const { sessionCode, shipmentId } = useParams<{ sessionCode: string; shipmentId: string }>();
  const navigate = useNavigate();

  const [identity, setIdentity] = useState<{name: string; role: string} | null>(null);
  const [shipmentDetails, setShipmentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [receivedQty, setReceivedQty] = useState('');
  const [condition, setCondition] = useState('Good condition');
  const [signatureName, setSignatureName] = useState('');

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    // Check for identity
    const storedIdentity = sessionStorage.getItem('user_identity');
    if (storedIdentity) {
      const parsed = JSON.parse(storedIdentity);
      setIdentity(parsed);
      setSignatureName(parsed.name);
    } else {
      // Redirect to identity page
      navigate(`/identity?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // Fetch shipment details
    const fetchShipment = async () => {
      if (!sessionCode || !shipmentId) return;

      try {
        const { data, error: fetchError } = await supabase
          .from('shipments_expected')
          .select('*')
          .eq('session_code', sessionCode)
          .eq('shipment_id', shipmentId)
          .single();

        if (fetchError) throw fetchError;

        setShipmentDetails(data);
        setReceivedQty(String(data.expected_qty)); // Pre-fill with expected
      } catch (err) {
        console.error('Error fetching shipment:', err);
        setError('Failed to load shipment details');
      } finally {
        setLoading(false);
      }
    };

    fetchShipment();
  }, [sessionCode, shipmentId, navigate]);

  // Canvas drawing
  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasSignature(true);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionCode || !shipmentId || !identity) return;

    setSubmitting(true);
    setError(null);

    try {
      const receiverName = `${identity.name}${identity.role ? ` (${identity.role})` : ''}`;

      // Insert to shipments_received
      const { error: insertError } = await supabase.from('shipments_received').insert({
        session_code: sessionCode,
        shipment_id: shipmentId,
        received_qty: parseInt(receivedQty, 10),
        received_at: new Date().toISOString(),
        receiver_name: receiverName,
        condition: condition,
        reconciled: false,
      });

      if (insertError) throw insertError;

      // Log activity
      await supabase.from('communications_log').insert({
        session_code: sessionCode,
        comm_type: 'notification',
        recipient: 'System',
        subject: `Receipt signed by ${receiverName}`,
        body: `${receiverName} signed delivery receipt for ${shipmentId}. Received ${receivedQty} units. Condition: ${condition}`,
      });

      setComplete(true);

      // Redirect after brief delay
      setTimeout(() => {
        window.close(); // Try to close tab if possible
      }, 2000);
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-bmf-blue animate-spin" />
      </div>
    );
  }

  if (error && !shipmentDetails) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (complete) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-lg">
          <Check className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Receipt Signed!</h1>
          <p className="text-gray-600">Thank you, {identity?.name}. Your signature has been recorded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bmf-blue to-bmf-blue-dark p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 mb-4 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <img src="/bmf-logo.png" alt="BMF" className="h-10" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Sign Delivery Receipt</h1>
              <p className="text-sm text-gray-600">
                Signed in as: <strong>{identity?.name}</strong>
                {identity?.role && ` (${identity.role})`}
              </p>
            </div>
          </div>

          {/* Shipment details */}
          {shipmentDetails && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h2 className="font-semibold text-gray-900 mb-2">Shipment Details</h2>
              <div className="space-y-1 text-sm text-gray-700">
                <p><strong>Shipment ID:</strong> {shipmentDetails.shipment_id}</p>
                <p><strong>Product:</strong> {shipmentDetails.expected_sku}</p>
                <p><strong>Expected Qty:</strong> {shipmentDetails.expected_qty} units</p>
                <p><strong>Vendor:</strong> {shipmentDetails.vendor}</p>
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-lg space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quantity Actually Received
            </label>
            <input
              type="number"
              value={receivedQty}
              onChange={(e) => setReceivedQty(e.target.value)}
              required
              min="0"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-bmf-blue focus:ring-2 focus:ring-bmf-blue/20 outline-none text-lg"
            />
            {shipmentDetails && parseInt(receivedQty) !== shipmentDetails.expected_qty && (
              <p className="text-amber-600 text-sm mt-1">
                ⚠️ Differs from expected ({shipmentDetails.expected_qty})
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Condition Notes
            </label>
            <textarea
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-bmf-blue focus:ring-2 focus:ring-bmf-blue/20 outline-none resize-none"
              rows={3}
              placeholder="Any damage, missing items, or quality issues?"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Signature
            </label>
            <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <button
                type="button"
                onClick={clearSignature}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear Signature
              </button>
              {!hasSignature && (
                <p className="text-xs text-gray-500 italic">Draw your signature above</p>
              )}
            </div>

            <div className="mt-3">
              <label className="block text-xs text-gray-600 mb-1">Or type your name:</label>
              <input
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-bmf-blue outline-none text-sm"
                placeholder={identity?.name}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !signatureName.trim()}
            className="w-full px-6 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Submit Receipt
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
