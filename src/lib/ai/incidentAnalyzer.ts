import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (!genAI) {
    if (!apiKey) {
      console.warn('VITE_GEMINI_API_KEY not set - Using mock analysis');
      return null;
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export interface IncidentAnalysisResult {
  isIncident: boolean;
  confidence: number;
  incident_type: string;
  severity: number; // 1-5
  location: string;
  description: string;
  needsEscalation: boolean;
  dismissalReason?: string; // If not an incident
  ambiguityNote?: string; // If confidence is medium
  routingDestination?: 'escalation' | 'review' | 'log_only'; // Where to route
  routingReason?: string; // Why routed there
}

export interface RoutingDecision {
  destination: 'escalation' | 'review' | 'log_only';
  reason: string;
  priority: number; // 1=highest, 5=lowest
  assignedTo?: string;
}

/**
 * Analyze an incident photo using Gemini Vision
 * Determines if it's a real incident, false positive, or ambiguous
 */
export async function analyzeIncidentPhoto(
  imageData: string // Base64 encoded image
): Promise<IncidentAnalysisResult> {
  const client = getClient();

  const prompt = `You are analyzing a photo submitted as a greenhouse incident report for Big Marble Farms.

Your task is to determine:
1. **Is this a real incident?** (equipment failure, safety hazard, pest issue, damage, etc.)
2. **Or is it a false positive?** (harmless objects, normal conditions, dropped items that aren't incidents)
3. **Or is it ambiguous?** (unclear if it's a problem or just needs closer inspection)

ANALYSIS CRITERIA:

**REAL INCIDENTS** (isIncident: true, confidence: 85-100):
- Equipment damage, malfunction, or breakdown
- Safety hazards (wet floors, exposed wires, broken glass, sharp objects)
- Pest infestations (insects, rodents, signs of damage)
- Plant disease or damage
- Water leaks, flooding
- HVAC or climate control issues
- Structural damage
- Chemical spills
- Fire hazards

**FALSE POSITIVES** (isIncident: false, confidence: 85-100):
- Dropped pen, pencil, or office supplies (harmless)
- Personal items (water bottle, phone, hat) not creating hazards
- Normal equipment in proper condition
- Clean, organized workspaces
- Routine maintenance activities (if clearly safe)
- People working normally with proper PPE

**AMBIGUOUS CASES** (isIncident: true, confidence: 50-75, needsEscalation: true):
- Stains or marks that could be mold OR just dirt
- Equipment that might be malfunctioning but unclear
- Small cracks that may or may not be structural
- Minor water accumulation (condensation vs leak)
- Unusual plant coloring (disease vs normal variation)

For each photo, provide:
{
  "isIncident": true/false,
  "confidence": 0-100 (how certain you are),
  "incident_type": "Equipment|Safety|Pest|Plant Health|Environmental|Quality|Structural",
  "severity": 1-5 (1=minor, 5=critical),
  "location": "Best guess at location (e.g., 'Zone 2, Row 8' or 'Packing area' or 'Near conveyor belt')",
  "description": "Clear 2-3 sentence description of what you see and why it is/isn't an incident",
  "needsEscalation": true/false (true if ambiguous or severity >= 4),
  "dismissalReason": "If false positive, explain why this isn't a real incident",
  "ambiguityNote": "If ambiguous, explain what's unclear and what should be checked"
}

Be conservative with severity ratings:
- Severity 1-2: Minor issues, routine fixes
- Severity 3: Moderate, needs attention soon
- Severity 4: Significant, urgent attention required
- Severity 5: Critical, immediate action, safety risk

Return ONLY valid JSON, no markdown formatting.`;

  if (!client) {
    // Return mock analysis for demo
    return generateMockIncidentAnalysis(imageData);
  }

  try {
    // Remove data URL prefix if present
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');

    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data,
              },
            },
          ],
        },
      ],
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Could not parse incident analysis response');
  } catch (error) {
    console.error('Error analyzing incident photo:', error);
    return generateMockIncidentAnalysis(imageData);
  }
}

// Generate mock analysis when API is unavailable
function generateMockIncidentAnalysis(imageData: string): IncidentAnalysisResult {
  // Use image size/hash as a simple way to vary results
  const hash = imageData.length % 7;

  const scenarios: IncidentAnalysisResult[] = [
    {
      isIncident: true,
      confidence: 92,
      incident_type: 'Equipment',
      severity: 4,
      location: 'Zone 3, Row 12',
      description: 'Conveyor belt appears jammed with visible mechanical damage. Motor housing shows signs of overheating. This poses a safety risk and is preventing normal operations.',
      needsEscalation: true,
    },
    {
      isIncident: true,
      confidence: 88,
      incident_type: 'Safety',
      severity: 3,
      location: 'Packing area near entrance',
      description: 'Water accumulation on floor creating slip hazard. Source appears to be condensation drip from overhead pipe. Area needs immediate attention and signage.',
      needsEscalation: false,
    },
    {
      isIncident: true,
      confidence: 95,
      incident_type: 'Pest',
      severity: 5,
      location: 'Zone 2, Growing benches',
      description: 'Significant aphid infestation visible on multiple tomato plants. Population appears out of control despite IPM program. Immediate intervention required to prevent crop loss.',
      needsEscalation: true,
    },
    {
      isIncident: false,
      confidence: 98,
      incident_type: 'N/A',
      severity: 1,
      location: 'Packing station',
      description: 'Image shows a dropped pen on clean floor surface. This is not a safety hazard or operational issue. No action needed.',
      needsEscalation: false,
      dismissalReason: 'False positive - harmless office supply on floor. Not an incident requiring reporting.',
    },
    {
      isIncident: true,
      confidence: 65,
      incident_type: 'Quality',
      severity: 3,
      location: 'Zone 1, Bench 5',
      description: 'Dark staining visible on plant leaves and growing medium. Could be fungal issue (Botrytis) or residue from fertilizer application. Unclear without closer inspection and testing.',
      needsEscalation: true,
      ambiguityNote: 'Needs closer inspection by growing team. If fungal, requires immediate isolation and treatment per SOP.',
    },
    {
      isIncident: true,
      confidence: 90,
      incident_type: 'Environmental',
      severity: 4,
      location: 'Zone 4, HVAC Unit B',
      description: 'HVAC unit showing visible ice buildup and condensation. Temperature monitoring in this zone likely compromised. Requires immediate maintenance to prevent crop stress.',
      needsEscalation: true,
    },
    {
      isIncident: true,
      confidence: 87,
      incident_type: 'Structural',
      severity: 3,
      location: 'Greenhouse panel near Zone 2',
      description: 'Cracked greenhouse glazing panel with visible gap. This could lead to heat loss, pest entry, and water infiltration. Should be replaced within 48 hours.',
      needsEscalation: false,
    },
  ];

  return scenarios[hash];
}

/**
 * Generate incident report email with summary
 */
export async function generateIncidentReportEmail(incidents: Array<{
  id: string;
  incident_type: string;
  severity: number;
  location: string;
  description: string;
  reported_by: string;
  reported_at: string;
}>): Promise<{ subject: string; body: string }> {
  const client = getClient();

  const criticalIncidents = incidents.filter(i => i.severity >= 4);
  const moderateIncidents = incidents.filter(i => i.severity === 3);
  const minorIncidents = incidents.filter(i => i.severity < 3);

  const prompt = `Draft a professional incident summary email for Big Marble Farms operations team.

INCIDENTS SUMMARY:
- Total incidents: ${incidents.length}
- Critical (Severity 4-5): ${criticalIncidents.length}
- Moderate (Severity 3): ${moderateIncidents.length}
- Minor (Severity 1-2): ${minorIncidents.length}

INCIDENT DETAILS:
${incidents.map((inc, idx) => `
${idx + 1}. [Severity ${inc.severity}] ${inc.incident_type} - ${inc.location}
   Reported by: ${inc.reported_by}
   Time: ${new Date(inc.reported_at).toLocaleString()}
   Description: ${inc.description}
`).join('\n')}

Write an email that:
1. Has an urgent but professional subject line (mention critical count if > 0)
2. Opens with executive summary (total incidents, critical count)
3. Lists incidents in severity order (critical first)
4. Uses clear formatting (bullet points, severity labels)
5. Ends with recommended actions and timeline
6. Maintains professional tone

Return JSON format:
{
  "subject": "subject line",
  "body": "email body with proper formatting"
}

Only return valid JSON, no markdown formatting.`;

  if (!client) {
    // Return fallback
    const subject = criticalIncidents.length > 0
      ? `URGENT: ${criticalIncidents.length} Critical Incident${criticalIncidents.length > 1 ? 's' : ''} Reported`
      : `Incident Summary: ${incidents.length} Report${incidents.length > 1 ? 's' : ''} Submitted`;

    const body = `Dear Operations Team,

This automated report summarizes recent incident reports submitted via the mobile reporting system.

SUMMARY:
• Total incidents: ${incidents.length}
• Critical (Severity 4-5): ${criticalIncidents.length}
• Moderate (Severity 3): ${moderateIncidents.length}
• Minor (Severity 1-2): ${minorIncidents.length}

${criticalIncidents.length > 0 ? `\nCRITICAL INCIDENTS REQUIRING IMMEDIATE ATTENTION:\n${criticalIncidents.map((inc, idx) => `${idx + 1}. ${inc.incident_type} - ${inc.location}\n   ${inc.description}\n   Reported by: ${inc.reported_by} at ${new Date(inc.reported_at).toLocaleTimeString()}`).join('\n\n')}\n` : ''}

${moderateIncidents.length > 0 ? `\nMODERATE INCIDENTS:\n${moderateIncidents.map((inc, idx) => `${idx + 1}. ${inc.incident_type} - ${inc.location}\n   ${inc.description}\n   Reported by: ${inc.reported_by}`).join('\n\n')}\n` : ''}

RECOMMENDED ACTIONS:
${criticalIncidents.length > 0 ? '• Address critical incidents immediately (within 1 hour)\n' : ''}• Review moderate incidents today
• Schedule minor incident resolution this week
• Update status in incident tracking system

Full details available in attached incident log.

Best regards,
Safety Monitoring System`;

    return { subject, body };
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Could not parse email response');
  } catch (error) {
    console.error('Error generating incident report email:', error);
    // Return fallback
    return {
      subject: `Incident Summary: ${incidents.length} Reports`,
      body: `See incident details in attached log. ${criticalIncidents.length} critical incidents require immediate attention.`,
    };
  }
}

/**
 * Determine routing destination based on severity and classification
 *
 * ROUTING RULES:
 * - Severity 5 (Critical): Escalation → Safety Team (immediate)
 * - Severity 4 (High): Escalation → Maintenance/Safety (urgent)
 * - Severity 3 (Moderate): Review Queue → Human review required
 * - Severity 2 (Minor): Log Only → Track for patterns
 * - Severity 1 (Minimal): Log Only → Informational
 * - Ambiguous (any severity): Review Queue → Human verification needed
 * - Low confidence (<75%): Review Queue → Human verification needed
 */
export function determineIncidentRouting(
  severity: number,
  classification: string,
  confidence: number,
  incidentType?: string
): RoutingDecision {
  // Critical severity - immediate escalation
  if (severity >= 5) {
    return {
      destination: 'escalation',
      reason: `Critical severity (${severity}/5) requires immediate Safety Team attention`,
      priority: 1,
      assignedTo: 'Safety Team',
    };
  }

  // High severity - urgent escalation
  if (severity === 4) {
    const team = incidentType?.toLowerCase().includes('pest') || incidentType?.toLowerCase().includes('food')
      ? 'Safety Team'
      : 'Maintenance Team';

    return {
      destination: 'escalation',
      reason: `High severity (${severity}/5) requires urgent ${team} intervention`,
      priority: 2,
      assignedTo: team,
    };
  }

  // Ambiguous classification - always needs human review
  if (classification === 'ambiguous') {
    return {
      destination: 'review',
      reason: 'Ambiguous classification requires human judgment and verification',
      priority: 2,
    };
  }

  // Low AI confidence - needs human verification
  if (confidence < 75) {
    return {
      destination: 'review',
      reason: `Low AI confidence (${confidence}%) - human verification recommended`,
      priority: 3,
    };
  }

  // Moderate severity - review queue
  if (severity === 3) {
    return {
      destination: 'review',
      reason: `Moderate severity (${severity}/5) requires Maintenance review and prioritization`,
      priority: 3,
      assignedTo: 'Maintenance Team',
    };
  }

  // Minor severity - log only
  if (severity <= 2 && severity > 0) {
    return {
      destination: 'log_only',
      reason: `Minor severity (${severity}/5) logged for tracking and pattern analysis`,
      priority: 4,
    };
  }

  // Default to log only for edge cases
  return {
    destination: 'log_only',
    reason: 'Incident logged for record keeping',
    priority: 5,
  };
}

/**
 * Enhanced analysis that includes routing decision
 */
export async function analyzeIncidentWithRouting(
  imageData: string
): Promise<IncidentAnalysisResult & { routing: RoutingDecision }> {
  const analysis = await analyzeIncidentPhoto(imageData);

  const routing = determineIncidentRouting(
    analysis.severity,
    analysis.isIncident ? 'real_incident' : 'false_positive',
    analysis.confidence,
    analysis.incident_type
  );

  return {
    ...analysis,
    routingDestination: routing.destination,
    routingReason: routing.reason,
    routing,
  };
}
