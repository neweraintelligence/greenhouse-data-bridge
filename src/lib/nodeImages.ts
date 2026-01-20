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
    escalation: '/demo_pack/use_case_images/22_escalation_router_realistic.png', // Reuse for escalation
    communications: '/demo_pack/use_case_images/23_communications_layer_realistic.png', // Reuse for communications
    intake: '/demo_pack/use_case_images/16_data_staging_realistic.png',
    output: '/demo_pack/use_case_images/24_results_dashboard_realistic.png',
  },
  training: {
    excel: '/demo_pack/use_case_images/25_training_roster_realistic.png',
    'excel-ack': '/demo_pack/use_case_images/26_training_completion_realistic.png',
    paper: '/demo_pack/use_case_images/27_training_paper_signoff_realistic.png',
    // Reuse images for other training nodes
    outlook: '/demo_pack/use_case_images/28_training_email_realistic.png',
    processing: '/demo_pack/use_case_images/29_training_compliance_check_realistic.png',
    intake: '/demo_pack/use_case_images/30_training_intake_realistic.png',
    output: '/demo_pack/use_case_images/31_training_output_realistic.png',
  },
  incidents: {
    outlook: '/demo_pack/use_case_images/32_incident_report_realistic.png',
    paper: '/demo_pack/use_case_images/33_incident_photo_realistic.png',
    excel: '/demo_pack/use_case_images/34_incident_calendar_realistic.png',
    processing: '/demo_pack/use_case_images/35_incident_routing_realistic.png',
    intake: '/demo_pack/use_case_images/36_incident_queue_realistic.png',
    output: '/demo_pack/use_case_images/37_incident_dashboard_realistic.png',
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
