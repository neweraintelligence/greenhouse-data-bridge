/**
 * Participation URL Configuration for Each Use Case
 *
 * Each use case has unique QR codes and URLs that route to specific
 * mobile interfaces. DO NOT modify shipping entries - those are production.
 *
 * URL Format: /mobile-entry/{sessionCode}?source={sourceType}&node={nodeName}
 */

export interface ParticipationEndpoint {
  id: string;
  useCaseId: string;
  sourceType: string;
  nodeName: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;
}

export interface UseCaseParticipation {
  useCaseId: string;
  useCaseName: string;
  endpoints: ParticipationEndpoint[];
}

/**
 * Generate the full participation URL for a given endpoint
 */
export function getParticipationUrl(
  sessionCode: string,
  endpoint: ParticipationEndpoint
): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/mobile-entry/${sessionCode}?source=${endpoint.sourceType}&node=${encodeURIComponent(endpoint.nodeName)}`;
}

/**
 * Get all participation endpoints for a use case
 */
export function getUseCaseParticipation(useCaseId: string): UseCaseParticipation | undefined {
  return PARTICIPATION_CONFIG.find(p => p.useCaseId === useCaseId);
}

/**
 * Get all participation configs (excluding shipping which is separate)
 */
export function getAllParticipationConfigs(): UseCaseParticipation[] {
  return PARTICIPATION_CONFIG;
}

// ============================================
// PARTICIPATION CONFIGURATION BY USE CASE
// ============================================

export const PARTICIPATION_CONFIG: UseCaseParticipation[] = [
  // ============================================
  // SHIPPING & RECEIVING - DO NOT MODIFY
  // These are production URLs used in live demos
  // ============================================
  // {
  //   useCaseId: 'shipping',
  //   useCaseName: 'Shipping & Receiving',
  //   endpoints: [...] // LOCKED - handled separately
  // },

  // ============================================
  // TRAINING COMPLIANCE
  // ============================================
  {
    useCaseId: 'training',
    useCaseName: 'HR Training Acknowledgements',
    endpoints: [
      {
        id: 'training-roster-entry',
        useCaseId: 'training',
        sourceType: 'training_roster',
        nodeName: 'Training Roster Entry',
        displayName: 'Add Training Record',
        description: 'Log a new employee training acknowledgement',
        icon: 'GraduationCap',
        color: 'green',
      },
      {
        id: 'training-sign-off',
        useCaseId: 'training',
        sourceType: 'training_roster',
        nodeName: 'Training Sign-Off',
        displayName: 'Sign Training Form',
        description: 'Digital signature for training completion',
        icon: 'FileSignature',
        color: 'green',
      },
    ],
  },

  // ============================================
  // INCIDENT REPORTING
  // ============================================
  {
    useCaseId: 'incidents',
    useCaseName: 'Incident / Maintenance Intake',
    endpoints: [
      {
        id: 'incident-photo-report',
        useCaseId: 'incidents',
        sourceType: 'incidents',
        nodeName: 'Incident Photo Report',
        displayName: 'Report Incident',
        description: 'Select a photo and report an incident for AI analysis',
        icon: 'Camera',
        color: 'orange',
      },
      {
        id: 'incident-review-queue',
        useCaseId: 'incidents',
        sourceType: 'incident_review',
        nodeName: 'Incident Review Queue',
        displayName: 'Triage Incidents',
        description: 'Review ambiguous or low-confidence incidents',
        icon: 'ClipboardList',
        color: 'orange',
      },
      {
        id: 'incident-communications',
        useCaseId: 'incidents',
        sourceType: 'communications',
        nodeName: 'Incident Communications',
        displayName: 'View Drafted Emails',
        description: 'Review auto-drafted escalation emails',
        icon: 'Mail',
        color: 'orange',
      },
    ],
  },

  // ============================================
  // CUSTOMER PO INTAKE
  // ============================================
  {
    useCaseId: 'customer-orders',
    useCaseName: 'Customer PO Intake',
    endpoints: [
      {
        id: 'customer-order-entry',
        useCaseId: 'customer-orders',
        sourceType: 'customer_orders',
        nodeName: 'Customer Order Entry',
        displayName: 'Enter Customer Order',
        description: 'Add a new customer purchase order',
        icon: 'ClipboardList',
        color: 'teal',
      },
      {
        id: 'customer-order-review',
        useCaseId: 'customer-orders',
        sourceType: 'review_queue',
        nodeName: 'Order Review Queue',
        displayName: 'Review Orders',
        description: 'Review orders with pricing or availability issues',
        icon: 'AlertCircle',
        color: 'teal',
      },
    ],
  },

  // ============================================
  // QUALITY & COMPLIANCE
  // ============================================
  {
    useCaseId: 'quality',
    useCaseName: 'Quality & Compliance Documents',
    endpoints: [
      {
        id: 'quality-coa-entry',
        useCaseId: 'quality',
        sourceType: 'quality_issues',
        nodeName: 'COA Entry',
        displayName: 'Log COA Document',
        description: 'Record a Certificate of Analysis',
        icon: 'ShieldCheck',
        color: 'emerald',
      },
      {
        id: 'quality-review',
        useCaseId: 'quality',
        sourceType: 'review_queue',
        nodeName: 'Quality Review Queue',
        displayName: 'Review Quality Issues',
        description: 'Review failed tests or compliance exceptions',
        icon: 'AlertTriangle',
        color: 'emerald',
      },
    ],
  },
];

// ============================================
// QUICK LOOKUP HELPERS
// ============================================

/**
 * Get endpoint by ID
 */
export function getEndpointById(endpointId: string): ParticipationEndpoint | undefined {
  for (const useCase of PARTICIPATION_CONFIG) {
    const endpoint = useCase.endpoints.find(e => e.id === endpointId);
    if (endpoint) return endpoint;
  }
  return undefined;
}

/**
 * Get all endpoints for a specific sourceType
 */
export function getEndpointsBySourceType(sourceType: string): ParticipationEndpoint[] {
  const endpoints: ParticipationEndpoint[] = [];
  for (const useCase of PARTICIPATION_CONFIG) {
    endpoints.push(...useCase.endpoints.filter(e => e.sourceType === sourceType));
  }
  return endpoints;
}
