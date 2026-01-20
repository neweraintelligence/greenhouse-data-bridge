// Customer Order reconciliation engine
// Validates orders against price list and inventory

import type { Discrepancy, ReconciliationResult } from './types';

interface CustomerOrder {
  order_id: string;
  customer_id?: string;
  customer_name: string;
  customer_contact?: string;
  order_date: string;
  requested_delivery?: string;
  status: string;
  po_number?: string;
  total_value?: number;
}

interface OrderLine {
  order_id: string;
  line_number: number;
  sku: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  customer_price?: number;
  line_total?: number;
}

interface PriceListItem {
  sku: string;
  product_name: string;
  unit_price: number;
}

interface InventoryItem {
  sku: string;
  product_name: string;
  available_qty: number;
}

interface OrderIssue {
  order_id: string;
  issue_type: string;
  severity: string;
  sku?: string;
  details: string;
  recommended_action?: string;
}

export function reconcileCustomerOrders(
  orders: CustomerOrder[],
  lineItems: OrderLine[],
  priceList: PriceListItem[],
  inventory: InventoryItem[],
  preExistingIssues: OrderIssue[]
): ReconciliationResult {
  const discrepancies: Discrepancy[] = [];
  const cleanOrderIds: string[] = [];

  // Build lookup maps
  const priceBysku = new Map<string, number>();
  for (const item of priceList) {
    priceBysku.set(item.sku, item.unit_price);
  }

  const inventoryBySku = new Map<string, number>();
  for (const item of inventory) {
    inventoryBySku.set(item.sku, item.available_qty);
  }

  const linesByOrder = new Map<string, OrderLine[]>();
  for (const line of lineItems) {
    const existing = linesByOrder.get(line.order_id) || [];
    existing.push(line);
    linesByOrder.set(line.order_id, existing);
  }

  // Process each order
  for (const order of orders) {
    const orderLines = linesByOrder.get(order.order_id) || [];
    let hasIssue = false;

    for (const line of orderLines) {
      // Check 1: Invalid SKU
      const currentPrice = priceBysku.get(line.sku);
      if (currentPrice === undefined) {
        discrepancies.push({
          id: `disc-${order.order_id}-invalid-sku-${line.sku}`,
          type: 'sku_mismatch' as const,
          severity: 'high',
          shipment_id: order.order_id,
          field: 'sku',
          expected: 'Valid SKU',
          actual: line.sku,
          confidence: 100,
          recommendedAction: 'Verify SKU with customer. May be discontinued or entered incorrectly.',
          details: `SKU ${line.sku} not found in current price list for order ${order.order_id} from ${order.customer_name}.`,
        });
        hasIssue = true;
        continue;
      }

      // Check 2: Pricing mismatch
      if (line.customer_price && Math.abs(line.customer_price - currentPrice) > 0.01) {
        const priceDiff = (currentPrice - line.customer_price) * line.quantity;
        discrepancies.push({
          id: `disc-${order.order_id}-price-${line.sku}`,
          type: 'quantity_mismatch' as const, // Using available type
          severity: priceDiff > 50 ? 'high' : 'medium',
          shipment_id: order.order_id,
          field: 'unit_price',
          expected: `$${currentPrice.toFixed(2)}`,
          actual: `$${line.customer_price.toFixed(2)}`,
          difference: priceDiff,
          confidence: 100,
          recommendedAction: 'Contact customer to confirm pricing. Check for contract pricing or promotional terms.',
          details: `Price mismatch for ${line.product_name}: Customer expects $${line.customer_price.toFixed(2)}, current price is $${currentPrice.toFixed(2)}. Difference: $${priceDiff.toFixed(2)} on ${line.quantity} units.`,
        });
        hasIssue = true;
      }

      // Check 3: Stock availability
      const available = inventoryBySku.get(line.sku) || 0;
      if (line.quantity > available) {
        discrepancies.push({
          id: `disc-${order.order_id}-stock-${line.sku}`,
          type: 'quantity_mismatch' as const,
          severity: 'high',
          shipment_id: order.order_id,
          field: 'quantity',
          expected: `${line.quantity} requested`,
          actual: `${available} available`,
          difference: line.quantity - available,
          confidence: 95,
          recommendedAction: 'Offer partial fulfillment or backorder. Contact customer to discuss alternatives.',
          details: `Insufficient inventory for ${line.product_name}. Requested: ${line.quantity}, Available: ${available}. Shortage of ${line.quantity - available} units.`,
        });
        hasIssue = true;
      }
    }

    if (!hasIssue) {
      cleanOrderIds.push(order.order_id);
    }
  }

  // Include pre-existing issues from database
  for (const issue of preExistingIssues) {
    const existingDisc = discrepancies.find(d =>
      d.shipment_id === issue.order_id &&
      d.details.includes(issue.details.substring(0, 30))
    );

    if (!existingDisc) {
      discrepancies.push({
        id: `db-issue-${issue.order_id}-${issue.issue_type}`,
        type: mapIssueType(issue.issue_type),
        severity: issue.severity as 'low' | 'medium' | 'high' | 'critical',
        shipment_id: issue.order_id,
        field: issue.issue_type,
        expected: 'No issues',
        actual: 'Issue detected',
        confidence: 95,
        recommendedAction: issue.recommended_action || 'Review and resolve issue.',
        details: issue.details,
      });
    }
  }

  const avgConfidence = discrepancies.length > 0
    ? discrepancies.reduce((sum, d) => sum + d.confidence, 0) / discrepancies.length
    : 100;

  return {
    clean: cleanOrderIds,
    discrepancies,
    totalProcessed: orders.length,
    totalFlagged: discrepancies.length,
    avgConfidence: Math.round(avgConfidence),
  };
}

function mapIssueType(issueType: string): Discrepancy['type'] {
  switch (issueType) {
    case 'pricing_mismatch':
    case 'stock_unavailable':
      return 'quantity_mismatch';
    case 'invalid_sku':
    case 'duplicate_order':
      return 'sku_mismatch';
    default:
      return 'quantity_mismatch';
  }
}
