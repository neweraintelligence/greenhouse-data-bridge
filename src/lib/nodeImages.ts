// Map node types to their corresponding image files

export const nodeImageMap: Record<string, Record<string, string>> = {
  shipping: {
    excel: '/demo_pack/use_case_images/15_system_of_record_realistic.png',
    outlook: '/demo_pack/use_case_images/19_shipment_alerts_realistic.png',
    onedrive: '/demo_pack/use_case_images/20_digital_invoices_realistic.png',
    barcode: '/demo_pack/use_case_images/21_barcode_scans_realistic.png',
    paper: '/demo_pack/use_case_images/18_signed_receipt_realistic.png',
    etl: '/demo_pack/use_case_images/13_data_normalization_realistic.png', // Reuse for ETL visualization
    processing: '/demo_pack/use_case_images/17_reconciliation_realistic.png',
    reviewQueue: '/demo_pack/use_case_images/14_review_queue_realistic.png', // Reuse for review queue
    escalation: '/demo_pack/use_case_images/22_escalation_router_flow.png', // Reuse for escalation
    communications: '/demo_pack/use_case_images/23_communications_layer_flow.png', // Reuse for communications
    intake: '/demo_pack/use_case_images/16_data_staging_area.png',
    output: '/demo_pack/use_case_images/24_results_dashboard_flow.png',
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
  console.log('getNodeImage called:', { useCase, nodeType, sourceName });

  // Special case: Training use case has two excel nodes - route by source name
  if (useCase === 'training' && nodeType === 'excel' && sourceName === 'Acknowledgements') {
    const image = nodeImageMap[useCase]?.['excel-ack'] || null;
    console.log('Returning training ack image:', image);
    return image;
  }

  const image = nodeImageMap[useCase]?.[nodeType] || null;
  console.log('Returning image:', image, 'for', useCase, nodeType);
  return image;
}
