// Map node types to their corresponding image files
// Using WebP format for 90% smaller file sizes (28MB → 2.9MB)

export const nodeImageMap: Record<string, Record<string, string>> = {
  shipping: {
    excel: '/demo_pack/use_case_images/15_system_of_record_realistic.webp',
    outlook: '/demo_pack/use_case_images/19_shipment_alerts_realistic.webp',
    onedrive: '/demo_pack/use_case_images/20_digital_invoices_realistic.webp',
    barcode: '/demo_pack/use_case_images/21_barcode_scans_realistic.webp',
    paper: '/demo_pack/use_case_images/18_signed_receipt_realistic.webp',
    etl: '/demo_pack/use_case_images/13_data_normalization_realistic.webp',
    processing: '/demo_pack/use_case_images/17_reconciliation_realistic.webp',
    reviewQueue: '/demo_pack/use_case_images/14_review_queue_realistic.webp',
    escalation: '/demo_pack/use_case_images/22_escalation_router_realistic.webp',
    communications: '/demo_pack/use_case_images/23_communications_layer_realistic.webp',
    intake: '/demo_pack/use_case_images/16_data_staging_realistic.webp',
    output: '/demo_pack/use_case_images/24_results_dashboard_realistic.webp',
  },
  incidents: {
    outlook: '/demo_pack/use_case_images/32_incident_report_realistic.webp',
    paper: '/demo_pack/use_case_images/33_incident_photo_realistic.webp',
    excel: '/demo_pack/use_case_images/38_incident_raci_matrix_realistic.webp',
    processing: '/demo_pack/use_case_images/35_incident_routing_realistic.webp',
    intake: '/demo_pack/use_case_images/36_incident_queue_realistic.webp',
    output: '/demo_pack/use_case_images/37_incident_dashboard_realistic.webp',
    reviewQueue: '/demo_pack/use_case_images/39_incident_review_queue_realistic.webp',
    escalation: '/demo_pack/use_case_images/40_incident_escalation_emails_realistic.webp',
    etl: '/demo_pack/use_case_images/41_incident_data_normalization_realistic.webp',
    communications: '/demo_pack/use_case_images/42_incident_closing_loop_realistic.webp',
  },
  // Quality & Compliance - reuse appropriate images
  quality: {
    outlook: '/demo_pack/use_case_images/19_shipment_alerts_realistic.webp',
    paper: '/demo_pack/use_case_images/18_signed_receipt_realistic.webp',
    excel: '/demo_pack/use_case_images/15_system_of_record_realistic.webp',
    onedrive: '/demo_pack/use_case_images/20_digital_invoices_realistic.webp',
    etl: '/demo_pack/use_case_images/13_data_normalization_realistic.webp',
    processing: '/demo_pack/use_case_images/17_reconciliation_realistic.webp',
    reviewQueue: '/demo_pack/use_case_images/14_review_queue_realistic.webp',
    intake: '/demo_pack/use_case_images/16_data_staging_realistic.webp',
    output: '/demo_pack/use_case_images/24_results_dashboard_realistic.webp',
  },
  // ========================================
  // TEMPLATE USE CASES (BYO - single hero image each)
  // ========================================
  supplier_management: {
    hero: '/demo_pack/use_case_images/50_supplier_management_realistic.webp',
  },
  customer_orders: {
    hero: '/demo_pack/use_case_images/51_customer_orders_realistic.webp',
  },
  regulatory_compliance: {
    hero: '/demo_pack/use_case_images/52_regulatory_compliance_realistic.webp',
  },
  equipment_maintenance: {
    hero: '/demo_pack/use_case_images/53_equipment_maintenance_realistic.webp',
  },
  accounts_payable: {
    hero: '/demo_pack/use_case_images/54_accounts_payable_realistic.webp',
  },
  hr_training: {
    hero: '/demo_pack/use_case_images/55_hr_training_realistic.webp',
  },
};

// Template use cases that only have a hero image (BYO workflows)
const templateUseCases = new Set([
  'supplier_management',
  'customer_orders',
  'regulatory_compliance',
  'equipment_maintenance',
  'accounts_payable',
  'hr_training',
]);

export function getNodeImage(useCase: string, nodeType: string, _sourceName?: string): string | null {
  // For template use cases, always return the hero image
  if (templateUseCases.has(useCase)) {
    return nodeImageMap[useCase]?.hero || null;
  }
  return nodeImageMap[useCase]?.[nodeType] || null;
}
