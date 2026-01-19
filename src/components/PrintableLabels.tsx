import { memo } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface Shipment {
  shipment_id: string;
  product_name: string;
  sku: string;
  expected_qty: number;
}

interface PrintableLabelsProps {
  sessionCode: string;
  shipments: Shipment[];
}

function PrintableLabelsComponent({ sessionCode, shipments }: PrintableLabelsProps) {
  // Add one extra "unexpected" shipment for demo
  const allLabels = [
    ...shipments.slice(0, 4), // First 4 expected shipments
    {
      shipment_id: 'EXTRA-001',
      product_name: 'Basil (UNEXPECTED)',
      sku: 'CTN-12OZ',
      expected_qty: 200,
    },
  ];

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
          const isExtra = shipment.shipment_id === 'EXTRA-001';

          // QR code encodes shipment data as JSON
          const qrData = JSON.stringify({
            sessionCode,
            shipmentId: shipment.shipment_id,
            sku: shipment.sku,
            productName: shipment.product_name,
            qty: shipment.expected_qty,
            timestamp: new Date().toISOString(),
          });

          return (
            <div
              key={idx}
              className={`p-6 rounded-2xl border-4 ${
                isExtra ? 'border-red-400 bg-red-50' : 'border-bmf-blue bg-blue-50'
              }`}
            >
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

                {/* Label info */}
                <div className="flex-1">
                  {isExtra && (
                    <div className="mb-2 px-2 py-1 bg-red-200 text-red-800 text-xs font-bold rounded inline-block">
                      ⚠️ EXTRA - NOT EXPECTED
                    </div>
                  )}
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

                  {isExtra && (
                    <p className="text-xs text-red-600 mt-3 italic">
                      Scan this to demo unexpected shipment detection
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="mt-12 p-6 rounded-2xl bg-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Demo Instructions:</h3>
        <ol className="space-y-2 text-sm text-gray-700" style={{ fontFamily: 'var(--font-body)' }}>
          <li>1. Print this page or display on a separate screen/tablet</li>
          <li>2. In the Barcode Log node, click the QR code to open scanner on your phone</li>
          <li>3. Scan labels 1-4 to add expected shipments (green checkmarks)</li>
          <li>4. Scan EXTRA-001 to trigger "unexpected shipment" error (red flag)</li>
          <li>5. Watch the laptop screen update in real-time as you scan</li>
        </ol>
      </div>

      {/* Print hint */}
      <div className="mt-8 text-center text-gray-400 text-sm print:hidden">
        <p>Press Ctrl+P (or Cmd+P) to print this page</p>
      </div>
    </div>
  );
}

export const PrintableLabels = memo(PrintableLabelsComponent);
