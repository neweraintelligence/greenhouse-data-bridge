import type { UseCase, UseCaseRegistry } from './types';

// Global registry
const registry: UseCaseRegistry = new Map();

export function registerUseCase(useCase: UseCase): void {
  registry.set(useCase.id, useCase);
}

export function getUseCase(id: string): UseCase | undefined {
  return registry.get(id);
}

export function getAllUseCases(): UseCase[] {
  return Array.from(registry.values());
}

export function getUseCaseIds(): string[] {
  return Array.from(registry.keys());
}

// Register default use cases
registerUseCase({
  id: 'shipping',
  name: 'Shipping & Receiving',
  description: 'Reconcile shipments, match Bills of Lading, invoices, and delivery receipts',
  icon: 'Truck',
  color: 'blue',
  sources: [
    { type: 'excel', name: 'Expected Shipments', icon: 'Table', description: 'Export from inventory/ERP system' },
    { type: 'outlook', name: 'Bill of Lading Email', icon: 'Mail', description: 'Email with Bill of Lading attachment' },
    { type: 'onedrive', name: 'Invoice PDF', icon: 'FileText', description: 'Vendor invoice from OneDrive' },
    { type: 'barcode', name: 'Barcode Log', icon: 'ScanLine', description: 'Barcode-to-PC scan log', optional: true },
    { type: 'paper', name: 'Delivery Receipt', icon: 'ClipboardCheck', description: 'Scanned paper receipt' },
  ],
  outputTemplates: [
    { id: 'reconciliation-report', name: 'Reconciliation Report', fileType: 'pdf', description: 'Summary of matched and mismatched shipments' },
    { id: 'discrepancy-notice', name: 'Discrepancy Notice', fileType: 'pdf', description: 'Details of quantity or document mismatches' },
    { id: 'reconciliation-export', name: 'Reconciliation Export', fileType: 'csv', description: 'Raw data for further analysis' },
  ],
  dashboardQueries: [
    { id: 'shipment-mismatches', name: 'Shipment Mismatches', description: 'Shipments with quantity discrepancies' },
    { id: 'mismatches-by-vendor', name: 'Mismatches by Vendor', description: 'Group mismatches by vendor' },
    { id: 'duplicate-documents', name: 'Duplicate Documents', description: 'Potential duplicate invoices or receipts' },
  ],
});

registerUseCase({
  id: 'incidents',
  name: 'Incident / Maintenance Intake',
  description: 'AI-powered incident detection with severity-based routing',
  icon: 'AlertTriangle',
  color: 'orange',
  sources: [
    { type: 'excel', name: 'Business Rules & RACI', icon: 'Users', description: 'Incident categories, severity definitions, and responsibility matrix (who gets notified, who owns exceptions)' },
    { type: 'paper', name: 'Incident Report Form', icon: 'ClipboardList', description: 'Mobile form: reporter signs in, selects location, uploads photos from gallery' },
  ],
  outputTemplates: [
    { id: 'incident-summary', name: 'Incident Summary', fileType: 'pdf', description: 'Overview of reported incidents' },
    { id: 'work-order', name: 'Work Order', fileType: 'pdf', description: 'Maintenance work order for high-severity items' },
    { id: 'safety-log', name: 'Safety Log', fileType: 'csv', description: 'All incidents for safety tracking' },
  ],
  dashboardQueries: [
    { id: 'open-incidents', name: 'Open Incidents', description: 'All unresolved incidents' },
    { id: 'high-severity-open', name: 'High Severity Open', description: 'Critical incidents requiring attention' },
    { id: 'sla-breaches', name: 'SLA Breaches', description: 'Incidents past response deadline' },
    { id: 'incidents-by-type', name: 'Incidents by Type', description: 'Group incidents by category' },
    { id: 'hot-zones', name: 'Hot Zones', description: 'Locations with most incidents' },
  ],
});

registerUseCase({
  id: 'quality',
  name: 'Quality & Compliance Documents',
  description: 'Process COAs, lab reports, and compliance documents against CanadaGAP standards',
  icon: 'ShieldCheck',
  color: 'emerald',
  sources: [
    { type: 'outlook', name: 'COA/Lab Report Email', icon: 'Mail', description: 'Certificate of Analysis from supplier or lab' },
    { type: 'paper', name: 'COA Document Scan', icon: 'FileSignature', description: 'Scanned COA or quality certificate' },
    { type: 'excel', name: 'Receiving Log', icon: 'ClipboardCheck', description: 'Incoming materials log to match' },
    { type: 'onedrive', name: 'CanadaGAP Reference', icon: 'BookOpen', description: 'CanadaGAP manual for compliance queries', optional: true },
  ],
  outputTemplates: [
    { id: 'compliance-summary', name: 'Compliance Summary', fileType: 'pdf', description: 'Overview of compliance status for received materials' },
    { id: 'exception-report', name: 'Exception Report', fileType: 'pdf', description: 'Failed tests or missing documentation' },
    { id: 'quality-log-export', name: 'Quality Log Export', fileType: 'csv', description: 'Full quality records for audit' },
  ],
  dashboardQueries: [
    { id: 'pending-review', name: 'Pending Review', description: 'COAs awaiting verification' },
    { id: 'failed-tests', name: 'Failed Tests', description: 'Materials with out-of-spec results' },
    { id: 'expiring-materials', name: 'Expiring Materials', description: 'Items approaching expiration' },
    { id: 'supplier-compliance', name: 'Supplier Compliance Score', description: 'Compliance rate by supplier' },
  ],
});
