// Core types for reconciliation and processing

export interface Discrepancy {
  id: string;
  type: 'quantity_mismatch' | 'sku_mismatch' | 'missing_scan' | 'extra_scan' | 'missing_receipt' | 'condition_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  shipment_id: string;
  field: string;
  expected: string | number;
  actual: string | number;
  difference?: number | string;
  confidence: number; // 0-100
  recommendedAction: string;
  details: string;
}

export interface ReconciliationResult {
  clean: string[]; // Shipment IDs with no issues
  discrepancies: Discrepancy[];
  totalProcessed: number;
  totalFlagged: number;
  avgConfidence: number;
}

export interface ComplianceGap {
  id: string;
  employee_id: string;
  employee_name: string;
  issue: 'missing_acknowledgement' | 'overdue' | 'incomplete_signature';
  severity: 'low' | 'medium' | 'high';
  details: string;
  recommendedAction: string;
}

export interface IncidentFlag {
  id: string;
  incident_id: string;
  issue: 'missing_field' | 'high_severity' | 'sla_breach' | 'duplicate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  field?: string;
  details: string;
  routeTo?: string;
  recommendedAction: string;
}

// Discrepancy type extension for Quality use case
export type QualityDiscrepancy = Omit<Discrepancy, 'type'> & {
  type: 'short_shelf_life' | 'missing_coa' | 'failed_test' | 'expired_material' | 'documentation_gap';
  canadagap_section?: string;
};

// ============================================
// QUALITY & COMPLIANCE TYPES
// ============================================

export interface QualityIssue {
  id: string;
  receiving_id: string;
  type: 'short_shelf_life' | 'missing_coa' | 'failed_test' | 'expired_material' | 'documentation_gap';
  severity: 'low' | 'medium' | 'high' | 'critical';
  material_name: string;
  lot_number: string;
  supplier_name: string;
  details: string;
  canadagap_section: string;
  recommendedAction: string;
}

export interface QualityReconciliationResult {
  clean: string[]; // Receiving IDs with no issues
  issues: QualityIssue[];
  totalProcessed: number;
  totalFlagged: number;
  complianceScore: number; // 0-100
  supplierScores: Record<string, number>;
}

// ============================================
// EXPENSE PROCESSING TYPES
// ============================================

export interface ExpenseViolation {
  id: string;
  expense_id: string;
  type: 'over_limit' | 'missing_receipt' | 'unapproved_category' | 'duplicate' | 'policy_violation';
  severity: 'low' | 'medium' | 'high';
  amount: number;
  category: string;
  details: string;
  recommendedAction: string;
}

export interface ExpenseReconciliationResult {
  approved: string[]; // Expense IDs approved
  violations: ExpenseViolation[];
  totalProcessed: number;
  totalApproved: number;
  totalFlagged: number;
  totalAmount: number;
  amountApproved: number;
  amountFlagged: number;
}

// ============================================
// CUSTOMER ORDER TYPES
// ============================================

export interface OrderIssue {
  id: string;
  order_id: string;
  type: 'pricing_mismatch' | 'stock_unavailable' | 'invalid_sku' | 'duplicate_order' | 'credit_hold';
  severity: 'low' | 'medium' | 'high';
  sku?: string;
  expected_price?: number;
  actual_price?: number;
  quantity_requested?: number;
  quantity_available?: number;
  details: string;
  recommendedAction: string;
}

export interface OrderReconciliationResult {
  clean: string[]; // Order IDs ready to process
  issues: OrderIssue[];
  totalProcessed: number;
  totalReady: number;
  totalFlagged: number;
  totalOrderValue: number;
}
