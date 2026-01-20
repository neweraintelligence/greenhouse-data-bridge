import { memo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, CheckCheck } from 'lucide-react';

interface ShipmentWithStatus {
  shipment_id: string;
  product_name: string;
  sku: string;
  expected_qty: number;
  isScanned: boolean;
  isReceived: boolean;
}

interface PrintableLabelsProps {
  sessionCode: string;
  shipments: ShipmentWithStatus[];
}

function PrintableLabelsComponent({ sessionCode, shipments }: PrintableLabelsProps) {
  // Use all shipments passed from parent (already includes status)
  const allLabels = shipments;

  return (
    <div className="w-full p-8 bg-white">
      {/* Header */}
      <div className="text-center mb-8">
        <img src="/bmf-logo.png" alt="Big Marble Farms" className="h-16 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Shipping Labels - QR Scanner Demo
        </h1>
        <p className="text-gray-600">Session: <code className="px-2 py-1 bg-gray-100 rounded font-mono">{sessionCode}</code></p>
        <p className="text-sm text-gray-500 mt-2">
          Scan these QR codes with your phone during the workshop demo
        </p>
      </div>

      {/* Labels grid */}
      <div className="grid grid-cols-2 gap-8">
        {allLabels.map((shipment, idx) => {
          // QR code encodes shipment data as JSON
          const qrData = JSON.stringify({
            sessionCode,
            shipmentId: shipment.shipment_id,
            sku: shipment.sku,
            productName: shipment.product_name,
            qty: shipment.expected_qty,
            timestamp: new Date().toISOString(),
          });

          // Determine border/bg based on status (only visible on screen, not printed)
          const borderClass = shipment.isReceived
            ? 'border-emerald-500 bg-emerald-50 print:border-bmf-blue print:bg-blue-50'
            : shipment.isScanned
            ? 'border-amber-500 bg-amber-50 print:border-bmf-blue print:bg-blue-50'
            : 'border-bmf-blue bg-blue-50';

          return (
            <div
              key={idx}
              className={`p-6 rounded-2xl border-4 ${borderClass} relative`}
            >
              {/* Status badge - screen only */}
              {(shipment.isScanned || shipment.isReceived) && (
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 print:hidden ${
                  shipment.isReceived
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-500 text-white'
                }`}>
                  {shipment.isReceived ? (
                    <>
                      <CheckCheck className="w-3 h-3" />
                      Received
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3" />
                      Scanned
                    </>
                  )}
                </div>
              )}

              <div className="flex items-start gap-4">
                {/* QR Code */}
                <div className="bg-white p-3 rounded-xl shadow-md">
                  <QRCodeSVG
                    value={qrData}
                    size={120}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                {/* Label info - all labels look identical and professional */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                    {shipment.shipment_id}
                  </h3>
                  <p className="text-lg text-gray-700 mb-3">{shipment.product_name}</p>

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">SKU:</span>
                      <code className="px-2 py-0.5 bg-white rounded font-mono font-semibold">
                        {shipment.sku}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Qty:</span>
                      <code className="px-2 py-0.5 bg-white rounded font-mono font-semibold">
                        {shipment.expected_qty} units
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PAGE BREAK FOR PRINTING */}
      <div className="print:break-before-page mt-16 mb-8">
        <hr className="border-t-2 border-gray-300 my-8" />
      </div>

      {/* Receipt Signing QR Codes */}
      <div className="mb-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Receipt Signing QR Codes
          </h2>
          <p className="text-gray-600 text-sm">
            Scan these with your phone to sign delivery receipts
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {shipments.map((shipment) => {
            // Generate receipt signing URL
            const receiptUrl = `${window.location.origin}/sign-receipt/${sessionCode}/${shipment.shipment_id}`;

            // Border styling based on status (screen only)
            const borderClass = shipment.isReceived
              ? 'border-gray-300 bg-gray-50 print:border-emerald-500 print:bg-emerald-50'
              : 'border-emerald-500 bg-emerald-50';

            return (
              <div
                key={shipment.shipment_id}
                className={`p-5 rounded-xl border-3 ${borderClass} relative`}
              >
                {/* Received badge - screen only */}
                {shipment.isReceived && (
                  <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 bg-emerald-500 text-white print:hidden">
                    <CheckCheck className="w-3 h-3" />
                    Signed
                  </div>
                )}

                <div className="flex items-center gap-4">
                  {/* QR Code for Receipt */}
                  <div className="bg-white p-3 rounded-lg shadow-md flex-shrink-0">
                    <QRCodeSVG
                      value={receiptUrl}
                      size={100}
                      level="M"
                      includeMargin={false}
                    />
                  </div>

                  {/* Shipment Info */}
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 mb-1">
                      {shipment.shipment_id}
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">{shipment.product_name}</p>
                    <div className={`px-2 py-1 rounded text-xs font-semibold inline-block ${
                      shipment.isReceived
                        ? 'bg-gray-200 text-gray-600 print:bg-emerald-100 print:text-emerald-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {shipment.isReceived ? 'Already Signed' : 'Sign Receipt'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-12 p-6 rounded-2xl bg-gray-100 print:hidden">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Workshop Demo Instructions:</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">📦 Product Barcode Scanning:</h4>
            <ol className="space-y-1.5 text-sm text-gray-700" style={{ fontFamily: 'var(--font-body)' }}>
              <li>1. In Barcode Log node, scan session QR</li>
              <li>2. Opens mobile scanner on your phone</li>
              <li>3. Scan product labels (blue boxes above)</li>
              <li>4. Labels turn amber when scanned</li>
              <li>5. System validates each scan in real-time</li>
              <li>6. Watch laptop dashboard update live</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">✍️ Receipt Signing:</h4>
            <ol className="space-y-1.5 text-sm text-gray-700" style={{ fontFamily: 'var(--font-body)' }}>
              <li>1. After products are scanned</li>
              <li>2. Scan a receipt QR code (green boxes)</li>
              <li>3. Opens signing form on phone</li>
              <li>4. Enter received quantity</li>
              <li>5. Sign with finger or type name</li>
              <li>6. Labels turn green when signed</li>
            </ol>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Live Status:</strong> Labels update in real-time as items are scanned and signed. Blue = pending, Amber = scanned, Green = received.
          </p>
        </div>
      </div>

      {/* Print hint */}
      <div className="mt-8 text-center text-gray-400 text-sm print:hidden">
        <p>Press Ctrl+P (or Cmd+P) to print this page</p>
      </div>
    </div>
  );
}

export const PrintableLabels = memo(PrintableLabelsComponent);
