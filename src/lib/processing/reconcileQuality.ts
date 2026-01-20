// Quality/Compliance reconciliation engine
// Compares receiving log against COA records to find compliance issues

import type { Discrepancy, ReconciliationResult } from './types';

interface ReceivingEntry {
  receiving_id: string;
  received_date: string;
  supplier_id?: string;
  supplier_name: string;
  sku: string;
  material_name: string;
  lot_number: string;
  quantity: number;
  unit: string;
  po_number?: string;
  receiver_name?: string;
}

interface COARecord {
  coa_id: string;
  receiving_id: string;
  lot_number: string;
  supplier_name: string;
  material_name: string;
  manufacture_date?: string;
  expiry_date?: string;
  test_results: Array<{
    test: string;
    result: number | string;
    unit: string;
    min_spec: number | string;
    max_spec: number | string;
    status: 'pass' | 'fail';
  }>;
  overall_status: 'pass' | 'fail' | 'pending_review';
  coa_received: boolean;
  shelf_life_weeks?: number;
}

interface QualityIssue {
  receiving_id: string;
  issue_type: string;
  severity: string;
  material_name: string;
  lot_number?: string;
  supplier_name?: string;
  details: string;
  canadagap_section?: string;
  recommended_action?: string;
}

// Minimum shelf life requirement (weeks)
const MIN_SHELF_LIFE_WEEKS = 12;

export function reconcileQuality(
  receivingLog: ReceivingEntry[],
  coaRecords: COARecord[],
  qualityIssues: QualityIssue[]
): ReconciliationResult {
  const discrepancies: Discrepancy[] = [];
  const cleanReceivingIds: string[] = [];

  // Build lookup map for COAs by receiving_id
  const coaByReceiving = new Map<string, COARecord>();
  for (const coa of coaRecords) {
    coaByReceiving.set(coa.receiving_id, coa);
  }

  // Process each receiving entry
  for (const entry of receivingLog) {
    const coa = coaByReceiving.get(entry.receiving_id);
    let hasIssue = false;

    // Check 1: Missing COA
    if (!coa || !coa.coa_received) {
      discrepancies.push({
        id: `disc-${entry.receiving_id}-missing-coa`,
        type: 'missing_receipt' as const, // Mapped to available type
        severity: 'critical',
        shipment_id: entry.receiving_id,
        field: 'coa',
        expected: 'COA document',
        actual: 'Not received',
        confidence: 100,
        recommendedAction: 'Contact supplier immediately to request COA. Quarantine material until documentation received.',
        details: `No Certificate of Analysis received for ${entry.material_name} (Lot: ${entry.lot_number}) from ${entry.supplier_name}. CanadaGAP Section 4.3.2 requires documentation for all incoming materials.`,
      });
      hasIssue = true;
      continue; // No further checks if COA missing
    }

    // Check 2: Failed test results
    if (coa.overall_status === 'fail') {
      const failedTests = coa.test_results.filter(t => t.status === 'fail');
      for (const test of failedTests) {
        discrepancies.push({
          id: `disc-${entry.receiving_id}-failed-${test.test.replace(/\s+/g, '-')}`,
          type: 'condition_issue' as const,
          severity: 'critical',
          shipment_id: entry.receiving_id,
          field: test.test,
          expected: `${test.min_spec} - ${test.max_spec} ${test.unit}`,
          actual: `${test.result} ${test.unit}`,
          confidence: 95,
          recommendedAction: 'Reject material and return to supplier. Do not use in production. Document rejection per CanadaGAP Section 4.3.1.',
          details: `${entry.material_name} (Lot: ${entry.lot_number}) failed ${test.test} test. Result: ${test.result} ${test.unit} (Spec: ${test.min_spec}-${test.max_spec} ${test.unit}).`,
        });
        hasIssue = true;
      }
    }

    // Check 3: Short shelf life
    if (coa.expiry_date) {
      const receivedDate = new Date(entry.received_date);
      const expiryDate = new Date(coa.expiry_date);
      const weeksRemaining = Math.floor((expiryDate.getTime() - receivedDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

      if (weeksRemaining < MIN_SHELF_LIFE_WEEKS) {
        discrepancies.push({
          id: `disc-${entry.receiving_id}-shelf-life`,
          type: 'condition_issue' as const,
          severity: 'high',
          shipment_id: entry.receiving_id,
          field: 'shelf_life',
          expected: `≥${MIN_SHELF_LIFE_WEEKS} weeks`,
          actual: `${weeksRemaining} weeks`,
          difference: MIN_SHELF_LIFE_WEEKS - weeksRemaining,
          confidence: 100,
          recommendedAction: 'Request replacement or credit from supplier. Use material first if production schedule allows. CanadaGAP Section 4.5.1.',
          details: `${entry.material_name} (Lot: ${entry.lot_number}) has only ${weeksRemaining} weeks remaining shelf life. Policy requires minimum ${MIN_SHELF_LIFE_WEEKS} weeks at time of receipt.`,
        });
        hasIssue = true;
      }
    }

    // Check 4: Expired material
    if (coa.expiry_date) {
      const today = new Date();
      const expiryDate = new Date(coa.expiry_date);
      if (expiryDate < today) {
        discrepancies.push({
          id: `disc-${entry.receiving_id}-expired`,
          type: 'condition_issue' as const,
          severity: 'critical',
          shipment_id: entry.receiving_id,
          field: 'expiry_date',
          expected: 'Not expired',
          actual: `Expired ${coa.expiry_date}`,
          confidence: 100,
          recommendedAction: 'Reject immediately. Material cannot be used. Return to supplier for replacement.',
          details: `${entry.material_name} (Lot: ${entry.lot_number}) is expired as of ${coa.expiry_date}. Expired materials cannot be used.`,
        });
        hasIssue = true;
      }
    }

    if (!hasIssue) {
      cleanReceivingIds.push(entry.receiving_id);
    }
  }

  // Also include any pre-seeded quality issues from the database
  for (const issue of qualityIssues) {
    // Avoid duplicates - check if we already have a discrepancy for this receiving_id + type
    const existingDisc = discrepancies.find(d =>
      d.shipment_id === issue.receiving_id &&
      d.details.includes(issue.details.substring(0, 30))
    );

    if (!existingDisc) {
      discrepancies.push({
        id: `db-issue-${issue.receiving_id}-${issue.issue_type}`,
        type: mapIssueType(issue.issue_type),
        severity: issue.severity as 'low' | 'medium' | 'high' | 'critical',
        shipment_id: issue.receiving_id,
        field: issue.issue_type,
        expected: 'Compliant',
        actual: 'Non-compliant',
        confidence: 95,
        recommendedAction: issue.recommended_action || 'Review and resolve issue.',
        details: issue.details,
      });
    }
  }

  // Calculate average confidence
  const avgConfidence = discrepancies.length > 0
    ? discrepancies.reduce((sum, d) => sum + d.confidence, 0) / discrepancies.length
    : 100;

  return {
    clean: cleanReceivingIds,
    discrepancies,
    totalProcessed: receivingLog.length,
    totalFlagged: discrepancies.length,
    avgConfidence: Math.round(avgConfidence),
  };
}

function mapIssueType(issueType: string): Discrepancy['type'] {
  switch (issueType) {
    case 'missing_coa':
      return 'missing_receipt';
    case 'failed_test':
    case 'short_shelf_life':
    case 'expired_material':
      return 'condition_issue';
    default:
      return 'condition_issue';
  }
}
