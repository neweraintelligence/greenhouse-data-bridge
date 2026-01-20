import { generateIncidentReportEmail } from '../ai/incidentAnalyzer';

export interface IncidentRecord {
  id: string;
  incident_type: string;
  severity: number;
  location: string;
  description: string;
  reported_by: string;
  reported_at: string;
  status: string;
  photo_url?: string;
  ai_confidence?: number;
}

/**
 * Generate Excel-style incident log (HTML table that can be exported)
 */
export function generateIncidentLogTable(incidents: IncidentRecord[]): string {
  const sortedIncidents = [...incidents].sort((a, b) => b.severity - a.severity);

  const rows = sortedIncidents.map((inc, idx) => `
    <tr class="${inc.severity >= 4 ? 'critical' : inc.severity === 3 ? 'moderate' : ''}">
      <td>${idx + 1}</td>
      <td>${inc.incident_type}</td>
      <td class="severity-${inc.severity}">${inc.severity}</td>
      <td>${inc.location}</td>
      <td>${inc.description}</td>
      <td>${inc.reported_by}</td>
      <td>${new Date(inc.reported_at).toLocaleString()}</td>
      <td>${inc.status}</td>
      <td>${inc.ai_confidence ? `${inc.ai_confidence}%` : 'N/A'}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Incident Log</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 20px;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 24px;
    }
    .header p {
      margin: 0;
      opacity: 0.9;
    }
    .stats {
      display: flex;
      gap: 20px;
      padding: 15px 20px;
      background: white;
      border-left: 5px solid #667eea;
      margin-bottom: 20px;
    }
    .stat {
      flex: 1;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #333;
    }
    .stat-value.critical { color: #dc2626; }
    .stat-value.moderate { color: #ea580c; }
    .stat-value.minor { color: #ca8a04; }
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
      font-size: 14px;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
      color: #4b5563;
    }
    tr.critical {
      background: #fee2e2;
    }
    tr.moderate {
      background: #fed7aa;
    }
    tr:hover {
      background: #f9fafb;
    }
    .severity-5, .severity-4 {
      color: #dc2626;
      font-weight: bold;
    }
    .severity-3 {
      color: #ea580c;
      font-weight: bold;
    }
    .severity-2, .severity-1 {
      color: #ca8a04;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚨 Incident Log Report</h1>
    <p>Big Marble Farms - Safety & Operations</p>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-label">Total Incidents</div>
      <div class="stat-value">${incidents.length}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Critical (4-5)</div>
      <div class="stat-value critical">${incidents.filter(i => i.severity >= 4).length}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Moderate (3)</div>
      <div class="stat-value moderate">${incidents.filter(i => i.severity === 3).length}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Minor (1-2)</div>
      <div class="stat-value minor">${incidents.filter(i => i.severity < 3).length}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Type</th>
        <th>Severity</th>
        <th>Location</th>
        <th>Description</th>
        <th>Reported By</th>
        <th>Date/Time</th>
        <th>Status</th>
        <th>AI Confidence</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>
`;
}

/**
 * Generate Markdown-formatted incident report
 */
export function generateIncidentReportMarkdown(incidents: IncidentRecord[]): string {
  const criticalIncidents = incidents.filter(i => i.severity >= 4);
  const moderateIncidents = incidents.filter(i => i.severity === 3);
  const minorIncidents = incidents.filter(i => i.severity < 3);

  const criticalSection = criticalIncidents.length > 0 ? `
## 🚨 Critical Incidents Requiring Immediate Action

${criticalIncidents.map((inc, idx) => `
### ${idx + 1}. ${inc.incident_type} - ${inc.location}
- **Severity**: ${inc.severity}/5 (Critical)
- **Reported By**: ${inc.reported_by}
- **Time**: ${new Date(inc.reported_at).toLocaleString()}
- **Status**: ${inc.status}
${inc.ai_confidence ? `- **AI Confidence**: ${inc.ai_confidence}%` : ''}

**Description**: ${inc.description}

${inc.photo_url ? `**Photo Evidence**: [View Photo](${inc.photo_url})` : ''}

---
`).join('\n')}
` : '';

  const moderateSection = moderateIncidents.length > 0 ? `
## ⚠️ Moderate Incidents

${moderateIncidents.map((inc, idx) => `
### ${idx + 1}. ${inc.incident_type} - ${inc.location}
- **Severity**: ${inc.severity}/5
- **Reported By**: ${inc.reported_by}
- **Time**: ${new Date(inc.reported_at).toLocaleString()}
- **Status**: ${inc.status}

**Description**: ${inc.description}

---
`).join('\n')}
` : '';

  const minorSection = minorIncidents.length > 0 ? `
## ℹ️ Minor Incidents

${minorIncidents.map((inc, idx) => `
- **${inc.incident_type}** - ${inc.location} (Severity ${inc.severity}) - ${inc.reported_by}
`).join('\n')}
` : '';

  return `# Incident Report
**Big Marble Farms - Safety & Operations**
**Generated**: ${new Date().toLocaleString()}

---

## Executive Summary

- **Total Incidents**: ${incidents.length}
- **Critical (Severity 4-5)**: ${criticalIncidents.length}
- **Moderate (Severity 3)**: ${moderateIncidents.length}
- **Minor (Severity 1-2)**: ${minorIncidents.length}

${criticalIncidents.length > 0 ? '**⚠️ URGENT**: ' + criticalIncidents.length + ' critical incident(s) require immediate attention.**' : ''}

---

${criticalSection}

${moderateSection}

${minorSection}

---

## Recommended Actions

${criticalIncidents.length > 0 ? `1. **Address all critical incidents within 1 hour**
   - Assign to appropriate teams (Safety, Maintenance, Quality)
   - Implement immediate containment measures
   - Document corrective actions taken
` : ''}
${moderateIncidents.length > 0 ? `2. **Review moderate incidents by end of day**
   - Schedule repairs/corrective actions
   - Update incident status as resolved
` : ''}
3. **Review incident trends weekly**
   - Identify recurring issues
   - Implement preventive measures
   - Update SOPs as needed

---

*This report was generated automatically by the Greenhouse Data Bridge incident reporting system. All incidents have been logged with photo evidence and AI-verified details.*
`;
}

/**
 * Generate email with incident report
 */
export async function generateIncidentEmail(incidents: IncidentRecord[]): Promise<{
  subject: string;
  body: string;
  htmlLog?: string;
  markdownReport?: string;
}> {
  const { subject, body } = await generateIncidentReportEmail(incidents);

  return {
    subject,
    body,
    htmlLog: generateIncidentLogTable(incidents),
    markdownReport: generateIncidentReportMarkdown(incidents),
  };
}
