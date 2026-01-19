import type { Discrepancy, ReconciliationResult } from './types';

interface ExpectedShipment {
  shipment_id: string;
  expected_qty: number;
  expected_sku: string;
  vendor: string;
}

interface BarcodeScan {
  shipment_id: string;
  qty_scanned: number;
  sku: string;
  scanned_by: string;
}

interface ReceivedShipment {
  shipment_id: string;
  received_qty: number;
  condition: string;
  reconciled: boolean;
}

export function reconcileShipments(
  expected: ExpectedShipment[],
  scanned: BarcodeScan[],
  received: ReceivedShipment[]
): ReconciliationResult {
  const discrepancies: Discrepancy[] = [];
  const clean: string[] = [];

  expected.forEach((order) => {
    const scan = scanned.find((s) => s.shipment_id === order.shipment_id);
    const rcvd = received.find((r) => r.shipment_id === order.shipment_id);

    const expectedQty = order.expected_qty;
    const scannedQty = scan?.qty_scanned || 0;
    const receivedQty = rcvd?.received_qty || 0;
    const expectedSku = order.expected_sku;
    const scannedSku = scan?.sku || '';

    // Check for missing scan
    if (!scan) {
      discrepancies.push({
        id: `disc-${order.shipment_id}-missing-scan`,
        type: 'missing_scan',
        severity: 'high',
        shipment_id: order.shipment_id,
        field: 'barcode_scan',
        expected: `${expectedQty} units`,
        actual: 'No scan data',
        confidence: 0,
        recommendedAction: 'Locate shipment and scan barcodes',
        details: `Shipment ${order.shipment_id} has no barcode scans on record`,
      });
      return; // Skip further checks for this shipment
    }

    // Check for SKU mismatch
    if (expectedSku !== scannedSku) {
      discrepancies.push({
        id: `disc-${order.shipment_id}-sku`,
        type: 'sku_mismatch',
        severity: 'critical',
        shipment_id: order.shipment_id,
        field: 'sku',
        expected: expectedSku,
        actual: scannedSku,
        confidence: 100, // Definite mismatch
        recommendedAction: 'Reject shipment - wrong product received',
        details: `Expected ${expectedSku}, but scanned ${scannedSku}. Wrong product delivered.`,
      });
    }

    // Check for quantity mismatch (expected vs scanned)
    if (expectedQty !== scannedQty) {
      const diff = expectedQty - scannedQty;
      const percentage = Math.abs((diff / expectedQty) * 100);

      discrepancies.push({
        id: `disc-${order.shipment_id}-qty`,
        type: 'quantity_mismatch',
        severity: percentage > 10 ? 'high' : percentage > 5 ? 'medium' : 'low',
        shipment_id: order.shipment_id,
        field: 'quantity',
        expected: expectedQty,
        actual: scannedQty,
        difference: diff,
        confidence: 95, // High confidence if scanned data exists
        recommendedAction:
          diff > 0
            ? 'Approve adjusted invoice (short shipment)'
            : 'Investigate overage',
        details: `Expected ${expectedQty} units, scanned ${scannedQty}. Shortage of ${Math.abs(diff)} units (${percentage.toFixed(1)}%).`,
      });
    }

    // Check if scanned matches received
    if (scannedQty !== receivedQty) {
      const diff = scannedQty - receivedQty;

      discrepancies.push({
        id: `disc-${order.shipment_id}-scan-vs-received`,
        type: 'quantity_mismatch',
        severity: 'medium',
        shipment_id: order.shipment_id,
        field: 'received_qty',
        expected: scannedQty,
        actual: receivedQty,
        difference: diff,
        confidence: 85,
        recommendedAction: 'Verify receiving count',
        details: `Scanned ${scannedQty} units but received record shows ${receivedQty}. Potential receiving error.`,
      });
    }

    // Check for condition issues
    if (rcvd && rcvd.condition && rcvd.condition !== 'Good condition') {
      discrepancies.push({
        id: `disc-${order.shipment_id}-condition`,
        type: 'condition_issue',
        severity: rcvd.condition.includes('rejected') ? 'high' : 'medium',
        shipment_id: order.shipment_id,
        field: 'condition',
        expected: 'Good condition',
        actual: rcvd.condition,
        confidence: 100,
        recommendedAction: 'Review damage report and adjust invoice',
        details: rcvd.condition,
      });
    }

    // If no discrepancies found for this shipment, mark as clean
    if (
      expectedQty === scannedQty &&
      expectedSku === scannedSku &&
      scannedQty === receivedQty &&
      (!rcvd || rcvd.condition === 'Good condition')
    ) {
      clean.push(order.shipment_id);
    }
  });

  // Calculate overall confidence
  const totalConfidence = discrepancies.reduce((sum, d) => sum + d.confidence, 0);
  const avgConfidence =
    discrepancies.length > 0
      ? Math.round(totalConfidence / discrepancies.length)
      : 100;

  return {
    clean,
    discrepancies,
    totalProcessed: expected.length,
    totalFlagged: discrepancies.length,
    avgConfidence,
  };
}

// Calculate confidence based on data agreement
export function calculateShipmentConfidence(
  expectedQty: number,
  scannedQty: number,
  receivedQty: number
): number {
  const agreements = [];

  // Expected vs scanned
  if (expectedQty === scannedQty) agreements.push(1);
  else {
    const diff = Math.abs(expectedQty - scannedQty);
    const percentage = (diff / expectedQty) * 100;
    agreements.push(Math.max(0, 1 - percentage / 100));
  }

  // Scanned vs received
  if (scannedQty === receivedQty) agreements.push(1);
  else {
    const diff = Math.abs(scannedQty - receivedQty);
    const percentage = (diff / scannedQty) * 100;
    agreements.push(Math.max(0, 1 - percentage / 100));
  }

  // Average agreement as confidence
  const avgAgreement = agreements.reduce((sum, a) => sum + a, 0) / agreements.length;
  return Math.round(avgAgreement * 100);
}
