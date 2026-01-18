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
  description: 'Reconcile shipments, match BOLs, invoices, and delivery receipts',
  icon: 'Truck',
  color: 'blue',
  sources: [
    { type: 'outlook', name: 'BOL Email', icon: 'Mail', description: 'Email with Bill of Lading attachment' },
    { type: 'excel', name: 'Expected Shipments', icon: 'Table', description: 'Export from inventory/ERP system' },
    { type: 'onedrive', name: 'Invoice PDF', icon: 'FileText', description: 'Vendor invoice from OneDrive' },
    { type: 'paper', name: 'Delivery Receipt', icon: 'ClipboardCheck', description: 'Scanned paper receipt' },
    { type: 'barcode', name: 'Barcode Log', icon: 'ScanLine', description: 'Barcode-to-PC scan log', optional: true },
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
  id: 'training',
  name: 'HR Training Acknowledgements',
  description: 'Track employee training completion and compliance',
  icon: 'GraduationCap',
  color: 'green',
  sources: [
    { type: 'excel', name: 'Training Roster', icon: 'Users', description: 'Employee roster from Payworks/HR' },
    { type: 'excel', name: 'Acknowledgements', icon: 'CheckSquare', description: 'Training acknowledgement records' },
    { type: 'paper', name: 'Sign-off Sheet', icon: 'FileSignature', description: 'Scanned paper sign-off form' },
    { type: 'outlook', name: 'Email Confirmations', icon: 'Mail', description: 'Training completion emails', optional: true },
  ],
  outputTemplates: [
    { id: 'compliance-report', name: 'Compliance Report', fileType: 'pdf', description: 'Training completion status by employee' },
    { id: 'overdue-acknowledgements', name: 'Overdue Acknowledgements', fileType: 'csv', description: 'Employees with missing or late acknowledgements' },
  ],
  dashboardQueries: [
    { id: 'overdue-training', name: 'Overdue Training', description: 'Employees past acknowledgement deadline' },
    { id: 'completion-by-department', name: 'Completion by Department', description: 'Training status grouped by department' },
    { id: 'completion-trend', name: 'Completion Trend', description: 'Training completion over time' },
  ],
});

registerUseCase({
  id: 'incidents',
  name: 'Incident / Maintenance Intake',
  description: 'Process incident reports and route to appropriate teams',
  icon: 'AlertTriangle',
  color: 'orange',
  sources: [
    { type: 'outlook', name: 'Incident Email', icon: 'Mail', description: 'Structured incident report email' },
    { type: 'paper', name: 'Photo Attachment', icon: 'Camera', description: 'Photo evidence of incident', optional: true },
    { type: 'excel', name: 'Maintenance Schedule', icon: 'Calendar', description: 'Scheduled maintenance tasks' },
    { type: 'outlook', name: 'Follow-up Email', icon: 'Reply', description: 'Additional info for incomplete reports', optional: true },
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
