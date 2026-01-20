// Product catalog for Big Marble Farms
const PRODUCT_CATALOG = {
  outbound: [
    { sku: 'PET-WAVE-606-PUR', name: 'Wave Petunia Purple (606 pack)', typical_qty: 48 },
    { sku: 'PET-WAVE-606-PINK', name: 'Wave Petunia Pink (606 pack)', typical_qty: 48 },
    { sku: 'PET-STVB-606-PINK', name: 'Supertunia Vista Bubblegum Pink (606 pack)', typical_qty: 72 },
    { sku: 'PET-STVB-606-PUR', name: 'Supertunia Vista Bubblegum Purple (606 pack)', typical_qty: 72 },
    { sku: 'GER-ZON-45-RED', name: 'Zonal Geranium Red (4.5" pot)', typical_qty: 24 },
    { sku: 'GER-IVY-HB10-MIX', name: 'Ivy Geranium Mix (10" hanging basket)', typical_qty: 12 },
    { sku: 'CAL-SBMG-1801-GRAPE', name: 'Superbells Magic Grapefruit (1801 pack)', typical_qty: 36 },
    { sku: 'TOM-CEL-1204', name: 'Celebrity Tomato (1204 pack)', typical_qty: 18 },
    { sku: 'BAS-SWT-804', name: 'Sweet Basil (804 pack)', typical_qty: 60 },
    { sku: 'PET-WAVE-HB10-PUR', name: 'Wave Petunia Purple (10" hanging basket)', typical_qty: 12 },
  ],
  inbound: [
    { sku: 'PLUG-288-PETWAVE', name: 'Petunia Wave Plugs (288-cell tray)', typical_qty: 20 },
    { sku: 'PLUG-288-TOMBF', name: 'Tomato Big Beef Plugs (288-cell tray)', typical_qty: 15 },
    { sku: 'SUNGRO-PROF-3CF', name: 'Sun Gro Professional Mix (3 cu ft bag)', typical_qty: 150 },
    { sku: 'JACK-201020-25LB', name: "Jack's 20-10-20 Fertilizer (25 lb bag)", typical_qty: 80 },
    { sku: 'INS-606-225', name: '606 Insert Trays (2.25" deep)', typical_qty: 500 },
  ],
};

const CUSTOMERS = [
  'Home Depot Store #4521',
  "Lowe's Store #8847",
  'Menards Store #2214',
  'Ace Hardware #5523',
  'Green Thumb Garden Center',
  'Whole Foods Market',
  'Premium Landscapes Inc',
];

const VENDORS = [
  'Ball Horticultural',
  'Sun Gro Horticulture',
  'JR Peters (Jacks)',
  'HC Companies',
  'Harris Seeds',
];

export interface GeneratedOrder {
  shipment_id: string;
  ship_date: string;
  vendor: string;
  destination: string;
  expected_qty: number;
  expected_sku: string;
  notes: string;
  direction: 'inbound' | 'outbound';
}

export interface GeneratedScan {
  shipment_id: string;
  sku: string;
  qty_scanned: number;
  scanned_by: string;
  scanned_at: string;
}

export interface GeneratedReceived {
  shipment_id: string;
  received_qty: number;
  received_at: string;
  receiver_name: string;
  condition: string;
  reconciled: boolean;
}

export interface GeneratedScenario {
  orders: GeneratedOrder[];
  scans: GeneratedScan[];
  received: GeneratedReceived[];
  plantedError: {
    shipment_id: string;
    type: 'qty_shortage' | 'sku_mismatch';
    description: string;
  } | null;
}

export function generateRandomScenario(): GeneratedScenario {
  // For demo reliability, use deterministic selection with variation
  // Instead of full AI generation, pick from catalog and add variation

  const numOrders = 5 + Math.floor(Math.random() * 4); // 5-8 orders
  const orders: GeneratedOrder[] = [];
  const scans: GeneratedScan[] = [];
  const received: GeneratedReceived[] = [];

  // Mix of outbound and inbound (60% outbound, 40% inbound)
  const numOutbound = Math.ceil(numOrders * 0.6);
  const numInbound = numOrders - numOutbound;

  let shipmentCounter = 1;

  // Generate outbound orders
  for (let i = 0; i < numOutbound; i++) {
    const product = PRODUCT_CATALOG.outbound[Math.floor(Math.random() * PRODUCT_CATALOG.outbound.length)];
    const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
    const qtyVariation = Math.floor(Math.random() * 21) - 10; // ±10 units
    const qty = Math.max(12, product.typical_qty + qtyVariation);

    const shipmentId = `OUT-2025-${String(shipmentCounter).padStart(4, '0')}`;
    shipmentCounter++;

    const date = new Date();
    date.setDate(date.getDate() + i + 1);

    orders.push({
      shipment_id: shipmentId,
      ship_date: date.toISOString().split('T')[0],
      vendor: customer,
      destination: customer.includes('Depot') ? 'HD Distribution Center' :
                  customer.includes('Lowe') ? 'Lowes Regional DC' :
                  customer.includes('Menards') ? 'Menards DC' :
                  customer,
      expected_qty: qty,
      expected_sku: product.sku,
      notes: product.name,
      direction: 'outbound',
    });

    // Generate matching scan (perfect or with planted error below)
    scans.push({
      shipment_id: shipmentId,
      sku: product.sku,
      qty_scanned: qty, // Will be modified if error planted
      scanned_by: ['Mike Chen', 'Sarah Johnson', 'Maria Rodriguez'][Math.floor(Math.random() * 3)],
      scanned_at: new Date(date.getTime() + 10 * 60 * 60 * 1000).toISOString(), // 10 hours after ship
    });

    // Generate matching received
    received.push({
      shipment_id: shipmentId,
      received_qty: qty,
      received_at: new Date(date.getTime() + 14 * 60 * 60 * 1000).toISOString(), // 14 hours after
      receiver_name: customer.includes('Depot') || customer.includes('Lowe') ? customer.split(' ')[0] + ' Receiving' : 'Customer Receiving',
      condition: 'Good condition',
      reconciled: true,
    });
  }

  // Generate inbound orders
  for (let i = 0; i < numInbound; i++) {
    const product = PRODUCT_CATALOG.inbound[Math.floor(Math.random() * PRODUCT_CATALOG.inbound.length)];
    const vendor = VENDORS[Math.floor(Math.random() * VENDORS.length)];
    const qtyVariation = Math.floor(Math.random() * 21) - 10;
    const qty = Math.max(10, product.typical_qty + qtyVariation);

    const shipmentId = `IN-2025-${String(shipmentCounter).padStart(4, '0')}`;
    shipmentCounter++;

    const date = new Date();
    date.setDate(date.getDate() + numOutbound + i + 1);

    orders.push({
      shipment_id: shipmentId,
      ship_date: date.toISOString().split('T')[0],
      vendor: vendor,
      destination: 'BMG ' + (product.sku.includes('PLUG') ? 'Greenhouse' : 'Supply Shed'),
      expected_qty: qty,
      expected_sku: product.sku,
      notes: product.name,
      direction: 'inbound',
    });

    scans.push({
      shipment_id: shipmentId,
      sku: product.sku,
      qty_scanned: qty,
      scanned_by: ['Mike Chen', 'Sarah Johnson', 'Maria Rodriguez'][Math.floor(Math.random() * 3)],
      scanned_at: new Date(date.getTime() + 10 * 60 * 60 * 1000).toISOString(),
    });

    received.push({
      shipment_id: shipmentId,
      received_qty: qty,
      received_at: new Date(date.getTime() + 14 * 60 * 60 * 1000).toISOString(),
      receiver_name: 'BMG Receiving',
      condition: 'Good condition',
      reconciled: true,
    });
  }

  // Plant ONE subtle error (50% chance qty shortage, 50% chance SKU mismatch)
  let plantedError: {
    shipment_id: string;
    type: 'qty_shortage' | 'sku_mismatch';
    description: string;
  } | null = null;

  if (orders.length > 2 && Math.random() > 0.2) { // 80% chance of planting error
    const errorType = Math.random() > 0.5 ? 'qty_shortage' : 'sku_mismatch';
    const targetIndex = 1 + Math.floor(Math.random() * (orders.length - 2)); // Not first or last
    const order = orders[targetIndex];

    if (errorType === 'qty_shortage') {
      // Reduce scanned quantity
      const shortage = Math.ceil(order.expected_qty * (0.1 + Math.random() * 0.15)); // 10-25% short
      scans[targetIndex].qty_scanned = order.expected_qty - shortage;
      received[targetIndex].received_qty = order.expected_qty - shortage;
      received[targetIndex].condition = `${shortage} units missing from delivery`;
      received[targetIndex].reconciled = false;

      plantedError = {
        shipment_id: order.shipment_id,
        type: 'qty_shortage',
        description: `Shortage: Expected ${order.expected_qty}, received ${scans[targetIndex].qty_scanned}`,
      };
    } else {
      // SKU mismatch - find similar product (same category, different variant)
      const originalSku = order.expected_sku;
      if (originalSku.includes('PET-STVB-606-PINK')) {
        scans[targetIndex].sku = 'PET-STVB-606-PUR'; // Wrong color
        received[targetIndex].condition = 'Received purple instead of pink - color variance';
        received[targetIndex].reconciled = false;

        plantedError = {
          shipment_id: order.shipment_id,
          type: 'sku_mismatch',
          description: 'Wrong color variant: Expected PINK, received PURPLE',
        };
      }
    }
  }

  return {
    orders,
    scans,
    received,
    plantedError,
  };
}

// Export as deterministic scenario (can add Gemini enhancement later)
export { generateRandomScenario as generateDeterministicScenario };
