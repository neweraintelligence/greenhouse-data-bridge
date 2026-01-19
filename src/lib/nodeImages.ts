// Map node types to their corresponding image files

export const nodeImageMap: Record<string, Record<string, string>> = {
  shipping: {
    excel: '/demo_pack/use_case_images/01_erp_purchase_order.png',
    outlook: '/demo_pack/use_case_images/02_email_bol_notification.png',
    onedrive: '/demo_pack/use_case_images/03_invoice_line_items.png',
    barcode: '/demo_pack/use_case_images/04_barcode_scanning_action.png',
    paper: '/demo_pack/use_case_images/05_digital_signature_tablet.png',
    etl: '/demo_pack/use_case_images/06_data_reconciliation_flow.png', // Reuse for ETL visualization
    processing: '/demo_pack/use_case_images/06_data_reconciliation_flow.png',
    reviewQueue: '/demo_pack/use_case_images/07_data_staging_inbox.png', // Reuse for review queue
    escalation: '/demo_pack/use_case_images/06_data_reconciliation_flow.png', // Reuse for escalation
    communications: '/demo_pack/use_case_images/02_email_bol_notification.png', // Reuse for communications
    intake: '/demo_pack/use_case_images/07_data_staging_inbox.png',
    output: '/demo_pack/use_case_images/08_dashboard_kpi_results.png',
  },
  training: {
    excel: '/demo_pack/use_case_images/09_training_roster_grid.png',
    'excel-ack': '/demo_pack/use_case_images/10b_training_acknowledgement.png',
    paper: '/demo_pack/use_case_images/10_paper_signoff_digitization.png',
    // Reuse images for other training nodes
    outlook: '/demo_pack/use_case_images/10_paper_signoff_digitization.png',
    processing: '/demo_pack/use_case_images/09_training_roster_grid.png',
    intake: '/demo_pack/use_case_images/09_training_roster_grid.png',
    output: '/demo_pack/use_case_images/09_training_roster_grid.png',
  },
  incidents: {
    outlook: '/demo_pack/use_case_images/11_incident_email_alert.png',
    paper: '/demo_pack/use_case_images/12_incident_photo_workflow.png',
    excel: '/demo_pack/use_case_images/12_incident_photo_workflow.png',
    processing: '/demo_pack/use_case_images/11_incident_email_alert.png',
    intake: '/demo_pack/use_case_images/11_incident_email_alert.png',
    output: '/demo_pack/use_case_images/11_incident_email_alert.png',
  },
};

export function getNodeImage(useCase: string, nodeType: string, sourceName?: string): string | null {
  // Special case: Training use case has two excel nodes - route by source name
  if (useCase === 'training' && nodeType === 'excel' && sourceName === 'Acknowledgements') {
    return nodeImageMap[useCase]?.['excel-ack'] || null;
  }
  return nodeImageMap[useCase]?.[nodeType] || null;
}
