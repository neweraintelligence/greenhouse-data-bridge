// Customer PO/Order data generator for Big Marble Farms
// Generates realistic customer orders with planted errors for demo

// Big Marble's product catalog (greenhouse produce)
const PRODUCTS = [
  { sku: 'TOM-BEEF-4LB', name: 'Beefsteak Tomatoes (4lb clamshell)', price: 8.99, category: 'tomatoes' },
  { sku: 'TOM-ROMA-2LB', name: 'Roma Tomatoes (2lb bag)', price: 5.49, category: 'tomatoes' },
  { sku: 'TOM-GRAPE-PNT', name: 'Grape Tomatoes (pint)', price: 4.99, category: 'tomatoes' },
  { sku: 'TOM-CHERRY-PNT', name: 'Cherry Tomatoes (pint)', price: 4.99, category: 'tomatoes' },
  { sku: 'CUC-ENG-EA', name: 'English Cucumber (each)', price: 2.49, category: 'cucumbers' },
  { sku: 'CUC-MINI-6PK', name: 'Mini Cucumbers (6-pack)', price: 4.99, category: 'cucumbers' },
  { sku: 'PEP-BELL-3PK', name: 'Bell Peppers (3-pack)', price: 5.99, category: 'peppers' },
  { sku: 'PEP-BELL-RED', name: 'Red Bell Pepper (each)', price: 2.49, category: 'peppers' },
  { sku: 'PEP-BELL-YEL', name: 'Yellow Bell Pepper (each)', price: 2.49, category: 'peppers' },
  { sku: 'PEP-BELL-ORG', name: 'Orange Bell Pepper (each)', price: 2.49, category: 'peppers' },
];

// Customers (grocery chains, distributors)
const CUSTOMERS = [
  { id: 'CUST-001', name: 'Sobeys Western', contact: 'orders@sobeys.ca', tier: 'A', creditLimit: 50000 },
  { id: 'CUST-002', name: 'Save-On-Foods', contact: 'produce@saveonfoods.com', tier: 'A', creditLimit: 75000 },
  { id: 'CUST-003', name: 'Calgary Co-op', contact: 'purchasing@calgarycoop.com', tier: 'B', creditLimit: 30000 },
  { id: 'CUST-004', name: 'Superstore Alberta', contact: 'vendor.orders@superstore.ca', tier: 'A', creditLimit: 100000 },
  { id: 'CUST-005', name: 'Federated Co-op', contact: 'orders@fcl.ca', tier: 'B', creditLimit: 25000 },
  { id: 'CUST-006', name: 'Sysco Calgary', contact: 'procurement@sysco.com', tier: 'A', creditLimit: 80000 },
];

// Current inventory levels (for availability checking)
const INVENTORY: Record<string, number> = {
  'TOM-BEEF-4LB': 450,
  'TOM-ROMA-2LB': 320,
  'TOM-GRAPE-PNT': 280,
  'TOM-CHERRY-PNT': 260,
  'CUC-ENG-EA': 520,
  'CUC-MINI-6PK': 180,
  'PEP-BELL-3PK': 150,
  'PEP-BELL-RED': 400,
  'PEP-BELL-YEL': 350,
  'PEP-BELL-ORG': 300,
};

export interface CustomerOrderEntry {
  order_id: string;
  customer_id: string;
  customer_name: string;
  customer_contact: string;
  order_date: string;
  requested_delivery: string;
  status: 'pending' | 'confirmed' | 'issue';
  po_number: string;
  total_value: number;
}

export interface OrderLineItem {
  order_id: string;
  line_number: number;
  sku: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  customer_price: number; // Price customer expects (may differ)
  line_total: number;
}

export interface OrderPlantedError {
  order_id: string;
  type: 'pricing_mismatch' | 'stock_unavailable' | 'invalid_sku' | 'duplicate_order';
  severity: 'medium' | 'high';
  description: string;
  sku?: string;
  recommendedAction: string;
}

export interface GeneratedCustomerOrderScenario {
  orders: CustomerOrderEntry[];
  lineItems: OrderLineItem[];
  plantedErrors: OrderPlantedError[];
  priceList: Array<{sku: string; name: string; price: number}>;
  inventory: Array<{sku: string; name: string; available: number}>;
}

function generatePONumber(customer: typeof CUSTOMERS[0]): string {
  const prefix = customer.name.substring(0, 3).toUpperCase();
  const num = Math.floor(Math.random() * 90000) + 10000;
  return `${prefix}-PO-${num}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function generateCustomerOrderScenario(): GeneratedCustomerOrderScenario {
  const orders: CustomerOrderEntry[] = [];
  const lineItems: OrderLineItem[] = [];
  const plantedErrors: OrderPlantedError[] = [];

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 2); // Start from 2 days ago

  let orderCounter = 1;

  // Generate 5-7 orders
  const numOrders = 5 + Math.floor(Math.random() * 3);

  // Select which order gets which planted error
  const pricingMismatchIndex = 1; // Second order
  const stockIssueIndex = 3; // Fourth order

  for (let i = 0; i < numOrders; i++) {
    const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
    const orderDate = addDays(baseDate, i);
    const deliveryDate = addDays(orderDate, 3 + Math.floor(Math.random() * 4)); // 3-6 days out
    const orderId = `ORD-2025-${String(orderCounter).padStart(4, '0')}`;
    orderCounter++;

    // Generate 2-5 line items per order
    const numLines = 2 + Math.floor(Math.random() * 4);
    let orderTotal = 0;
    const usedSkus = new Set<string>();

    for (let j = 0; j < numLines; j++) {
      // Pick a product not yet in this order
      let product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      while (usedSkus.has(product.sku)) {
        product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      }
      usedSkus.add(product.sku);

      const quantity = 10 + Math.floor(Math.random() * 90); // 10-99 units
      let customerPrice = product.price;

      // Planted error: pricing mismatch
      if (i === pricingMismatchIndex && j === 0) {
        // Customer expects old price (10% lower)
        customerPrice = Math.round(product.price * 0.9 * 100) / 100;

        plantedErrors.push({
          order_id: orderId,
          type: 'pricing_mismatch',
          severity: 'high',
          description: `Customer ${customer.name} expects $${customerPrice.toFixed(2)} for ${product.name}, but current price is $${product.price.toFixed(2)}. Price difference: $${((product.price - customerPrice) * quantity).toFixed(2)} on ${quantity} units.`,
          sku: product.sku,
          recommendedAction: 'Contact customer to confirm pricing. Check if promotional pricing or contract terms apply.',
        });
      }

      // Planted error: stock unavailable
      if (i === stockIssueIndex && j === 0) {
        const available = INVENTORY[product.sku] || 0;
        const requestedQty = available + 50 + Math.floor(Math.random() * 100); // Request more than available

        lineItems.push({
          order_id: orderId,
          line_number: j + 1,
          sku: product.sku,
          product_name: product.name,
          quantity: requestedQty,
          unit_price: product.price,
          customer_price: product.price,
          line_total: requestedQty * product.price,
        });

        orderTotal += requestedQty * product.price;

        plantedErrors.push({
          order_id: orderId,
          type: 'stock_unavailable',
          severity: 'high',
          description: `Insufficient inventory for ${product.name}. Requested: ${requestedQty}, Available: ${available}. Shortage of ${requestedQty - available} units.`,
          sku: product.sku,
          recommendedAction: 'Offer partial fulfillment or backorder. Contact customer to discuss alternatives.',
        });

        continue; // Skip normal line item creation
      }

      const lineTotal = quantity * product.price;
      orderTotal += lineTotal;

      lineItems.push({
        order_id: orderId,
        line_number: j + 1,
        sku: product.sku,
        product_name: product.name,
        quantity,
        unit_price: product.price,
        customer_price: customerPrice,
        line_total: lineTotal,
      });
    }

    orders.push({
      order_id: orderId,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_contact: customer.contact,
      order_date: orderDate.toISOString().split('T')[0],
      requested_delivery: deliveryDate.toISOString().split('T')[0],
      status: plantedErrors.some(e => e.order_id === orderId) ? 'issue' : 'pending',
      po_number: generatePONumber(customer),
      total_value: Math.round(orderTotal * 100) / 100,
    });
  }

  // Build price list and inventory for display
  const priceList = PRODUCTS.map(p => ({
    sku: p.sku,
    name: p.name,
    price: p.price,
  }));

  const inventory = PRODUCTS.map(p => ({
    sku: p.sku,
    name: p.name,
    available: INVENTORY[p.sku] || 0,
  }));

  return {
    orders,
    lineItems,
    plantedErrors,
    priceList,
    inventory,
  };
}

export { generateCustomerOrderScenario as generateDeterministicCustomerOrderScenario };
