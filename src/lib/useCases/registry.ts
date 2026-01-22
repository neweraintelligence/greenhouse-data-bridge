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

// ========================================
// TEMPLATE USE CASES (Participant-Filled)
// ========================================

// Greenhouse-specific templates
registerUseCase({
  id: 'supplier_management',
  name: 'Supplier Management',
  description: 'Track vendor documents, certifications, and contract compliance',
  icon: 'Building2',
  color: 'teal',
  isTemplate: true,
  sources: [
    { type: 'excel', name: 'Input 1', icon: 'FileQuestion', description: 'Awaiting definition...' },
    { type: 'outlook', name: 'Input 2', icon: 'FileQuestion', description: 'Awaiting definition...' },
    { type: 'paper', name: 'Input 3', icon: 'FileQuestion', description: 'Awaiting definition...' },
  ],
  outputTemplates: [
    { id: 'template-report', name: 'Generated Report', fileType: 'pdf', description: 'Summary report based on workflow' },
  ],
  dashboardQueries: [],
});

registerUseCase({
  id: 'customer_orders',
  name: 'Customer Orders',
  description: 'Process orders, confirmations, and delivery documentation',
  icon: 'ShoppingCart',
  color: 'amber',
  isTemplate: true,
  sources: [
    { type: 'outlook', name: 'Input 1', icon: 'FileQuestion', description: 'Awaiting definition...' },
    { type: 'excel', name: 'Input 2', icon: 'FileQuestion', description: 'Awaiting definition...' },
    { type: 'paper', name: 'Input 3', icon: 'FileQuestion', description: 'Awaiting definition...' },
  ],
  outputTemplates: [
    { id: 'template-report', name: 'Generated Report', fileType: 'pdf', description: 'Summary report based on workflow' },
  ],
  dashboardQueries: [],
});

registerUseCase({
  id: 'regulatory_compliance',
  name: 'Regulatory & Inspections',
  description: 'Track inspection reports, permits, and regulatory filings',
  icon: 'ClipboardCheck',
  color: 'emerald',
  isTemplate: true,
  sources: [
    { type: 'paper', name: 'Input 1', icon: 'FileQuestion', description: 'Awaiting definition...' },
    { type: 'outlook', name: 'Input 2', icon: 'FileQuestion', description: 'Awaiting definition...' },
    { type: 'excel', name: 'Input 3', icon: 'FileQuestion', description: 'Awaiting definition...' },
  ],
  outputTemplates: [
    { id: 'template-report', name: 'Generated Report', fileType: 'pdf', description: 'Summary report based on workflow' },
  ],
  dashboardQueries: [],
});

registerUseCase({
  id: 'equipment_maintenance',
  name: 'Equipment Maintenance',
  description: 'Log maintenance records, service reports, and equipment inspections',
  icon: 'Wrench',
  color: 'slate',
  isTemplate: true,
  sources: [
    { type: 'excel', name: 'Input 1', icon: 'FileQuestion', description: 'Awaiting definition...' },
    { type: 'paper', name: 'Input 2', icon: 'FileQuestion', description: 'Awaiting definition...' },
    { type: 'outlook', name: 'Input 3', icon: 'FileQuestion', description: 'Awaiting definition...' },
  ],
  outputTemplates: [
    { id: 'template-report', name: 'Generated Report', fileType: 'pdf', description: 'Summary report based on workflow' },
  ],
  dashboardQueries: [],
});

// Generic templates (work anywhere)
registerUseCase({
  id: 'accounts_payable',
  name: 'Accounts Payable',
  description: 'Match invoices, purchase orders, and payment approvals',
  icon: 'DollarSign',
  color: 'green',
  isTemplate: true,
  sources: [
    { type: 'outlook', name: 'Input 1', icon: 'FileQuestion', description: 'Awaiting definition...' },
    { type: 'excel', name: 'Input 2', icon: 'FileQuestion', description: 'Awaiting definition...' },
    { type: 'onedrive', name: 'Input 3', icon: 'FileQuestion', description: 'Awaiting definition...' },
  ],
  outputTemplates: [
    { id: 'template-report', name: 'Generated Report', fileType: 'pdf', description: 'Summary report based on workflow' },
  ],
  dashboardQueries: [],
});

registerUseCase({
  id: 'hr_training',
  name: 'HR & Training Records',
  description: 'Track employee certifications, training completions, and HR documents',
  icon: 'UserPlus',
  color: 'purple',
  isTemplate: true,
  sources: [
    { type: 'excel', name: 'Input 1', icon: 'FileQuestion', description: 'Awaiting definition...' },
    { type: 'paper', name: 'Input 2', icon: 'FileQuestion', description: 'Awaiting definition...' },
    { type: 'outlook', name: 'Input 3', icon: 'FileQuestion', description: 'Awaiting definition...' },
  ],
  outputTemplates: [
    { id: 'template-report', name: 'Generated Report', fileType: 'pdf', description: 'Summary report based on workflow' },
  ],
  dashboardQueries: [],
});
