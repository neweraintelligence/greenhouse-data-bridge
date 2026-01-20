/**
 * Incident Email Draft Generator
 *
 * Generates escalation emails based on incident severity and routing.
 * These are auto-drafted for review before sending.
 */

export interface IncidentEmailDraft {
  id: string;
  incidentId: string;
  recipient: string;
  recipientRole: string;
  subject: string;
  body: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  draftedAt: string;
  status: 'draft' | 'sent' | 'cancelled';
}

export interface IncidentForEmail {
  id: string;
  incident_type: string;
  severity: number;
  location: string;
  description: string;
  reported_by: string;
  reported_at: string;
  photo_url?: string;
  routed_to?: string;
}

/**
 * Email recipients based on routing destination
 */
const RECIPIENT_MAP: Record<string, { name: string; email: string; role: string }> = {
  'Safety Team': {
    name: 'Safety Team',
    email: 'safety@bigmarblefarms.com',
    role: 'Safety & Compliance',
  },
  'Maintenance Team': {
    name: 'Maintenance Team',
    email: 'maintenance@bigmarblefarms.com',
    role: 'Facilities & Equipment',
  },
  'Operations Manager': {
    name: 'Operations Manager',
    email: 'ops.manager@bigmarblefarms.com',
    role: 'Operations',
  },
  'Quality Team': {
    name: 'Quality Assurance',
    email: 'qa@bigmarblefarms.com',
    role: 'Quality & Compliance',
  },
};

/**
 * Generate email draft for an incident based on its severity and type
 */
export function generateIncidentEmailDraft(incident: IncidentForEmail): IncidentEmailDraft {
  const recipient = getRecipientForIncident(incident);
  const priority = getPriorityFromSeverity(incident.severity);
  const subject = generateSubject(incident, priority);
  const body = generateBody(incident, recipient);

  return {
    id: `email-${incident.id}-${Date.now()}`,
    incidentId: incident.id,
    recipient: recipient.email,
    recipientRole: recipient.role,
    subject,
    body,
    priority,
    draftedAt: new Date().toISOString(),
    status: 'draft',
  };
}

/**
 * Determine recipient based on incident type and severity
 */
function getRecipientForIncident(incident: IncidentForEmail): { name: string; email: string; role: string } {
  // Use explicit routing if available
  if (incident.routed_to && RECIPIENT_MAP[incident.routed_to]) {
    return RECIPIENT_MAP[incident.routed_to];
  }

  const type = incident.incident_type.toLowerCase();

  // Critical pest/food safety issues -> Safety Team
  if (type.includes('pest') || type.includes('aphid') || type.includes('infestation') ||
      type.includes('contamination') || type.includes('food safety')) {
    return RECIPIENT_MAP['Safety Team'];
  }

  // Equipment failures -> Maintenance Team
  if (type.includes('equipment') || type.includes('led') || type.includes('irrigation') ||
      type.includes('fertigation') || type.includes('hvac') || type.includes('failure')) {
    return RECIPIENT_MAP['Maintenance Team'];
  }

  // Crop diseases -> Quality Team (for tracking) or Safety if critical
  if (type.includes('disease') || type.includes('mildew') || type.includes('rot')) {
    return incident.severity >= 4
      ? RECIPIENT_MAP['Safety Team']
      : RECIPIENT_MAP['Quality Team'];
  }

  // Default to Operations Manager for anything else
  return RECIPIENT_MAP['Operations Manager'];
}

/**
 * Map severity to email priority
 */
function getPriorityFromSeverity(severity: number): 'critical' | 'high' | 'medium' | 'low' {
  if (severity >= 5) return 'critical';
  if (severity === 4) return 'high';
  if (severity === 3) return 'medium';
  return 'low';
}

/**
 * Generate email subject line
 */
function generateSubject(incident: IncidentForEmail, priority: string): string {
  const priorityPrefix = priority === 'critical'
    ? '[CRITICAL] '
    : priority === 'high'
    ? '[URGENT] '
    : '';

  return `${priorityPrefix}Incident Report: ${incident.incident_type} at ${incident.location}`;
}

/**
 * Generate email body with all incident details
 */
function generateBody(
  incident: IncidentForEmail,
  recipient: { name: string; role: string }
): string {
  const severityLabel = getSeverityLabel(incident.severity);
  const timestamp = new Date(incident.reported_at).toLocaleString();

  return `Dear ${recipient.name},

An incident has been reported that requires your attention.

INCIDENT DETAILS
─────────────────
Type: ${incident.incident_type}
Severity: ${incident.severity}/5 (${severityLabel})
Location: ${incident.location}
Reported By: ${incident.reported_by}
Reported At: ${timestamp}

DESCRIPTION
─────────────────
${incident.description}

${incident.severity >= 4 ? `
ACTION REQUIRED
─────────────────
This incident has been flagged as ${severityLabel.toUpperCase()} priority and requires immediate attention. Please respond within:
${incident.severity >= 5 ? '• 1 hour for initial assessment' : '• 4 hours for initial assessment'}
${incident.severity >= 5 ? '• 4 hours for resolution plan' : '• 24 hours for resolution plan'}
` : ''}
Please update the incident status in the system once you have reviewed and taken action.

This is an automated notification generated by Big Marble Farms Pipeline OS.

Best regards,
Pipeline OS - Incident Management`;
}

/**
 * Get human-readable severity label
 */
function getSeverityLabel(severity: number): string {
  switch (severity) {
    case 5: return 'Critical';
    case 4: return 'High';
    case 3: return 'Moderate';
    case 2: return 'Low';
    case 1: return 'Minor';
    default: return 'Unknown';
  }
}

/**
 * Generate multiple email drafts for an incident (e.g., CC to manager)
 */
export function generateIncidentEmailDrafts(incident: IncidentForEmail): IncidentEmailDraft[] {
  const drafts: IncidentEmailDraft[] = [];

  // Primary recipient
  drafts.push(generateIncidentEmailDraft(incident));

  // CC to Operations Manager for critical incidents
  if (incident.severity >= 5 && incident.routed_to !== 'Operations Manager') {
    const ccDraft = generateIncidentEmailDraft({
      ...incident,
      routed_to: 'Operations Manager',
    });
    ccDraft.id = `email-${incident.id}-cc-${Date.now()}`;
    ccDraft.subject = `[CC] ${ccDraft.subject}`;
    drafts.push(ccDraft);
  }

  return drafts;
}
