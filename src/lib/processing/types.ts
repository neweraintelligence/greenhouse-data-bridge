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
