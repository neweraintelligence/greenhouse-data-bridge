import { GoogleGenAI } from '@google/genai';
import type { Discrepancy, ReconciliationResult } from '../processing/types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!genAI) {
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY environment variable is not set');
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export interface ReconciliationReport {
  title: string;
  executiveSummary: string;
  statistics: {
    totalProcessed: number;
    cleanMatches: number;
    discrepanciesFound: number;
    avgConfidence: number;
  };
  cleanShipments: string[];
  discrepancyDetails: Array<{
    shipment_id: string;
    issue: string;
    severity: string;
    recommendation: string;
  }>;
  recommendations: string[];
}

export async function generateReconciliationReport(
  result: ReconciliationResult,
  decisions?: Array<{item_id: string; decision: string; comment?: string}>
): Promise<ReconciliationReport> {
  const client = getClient();

  const prompt = `Generate a comprehensive shipping reconciliation report for Big Marble Farms greenhouse.

Processing Results:
- Total Shipments Processed: ${result.totalProcessed}
- Clean Matches: ${result.clean.length}
- Discrepancies Found: ${result.totalFlagged}
- Average Confidence: ${result.avgConfidence}%

Discrepancy Breakdown:
${result.discrepancies.map((d, i) =>
  `${i + 1}. ${d.shipment_id}: ${d.type.replace(/_/g, ' ')} (${d.severity} severity)
   - Expected: ${d.expected}
   - Actual: ${d.actual}
   - Details: ${d.details}
   - Recommended Action: ${d.recommendedAction}`
).join('\n\n')}

${decisions && decisions.length > 0 ? `
Decisions Made:
${decisions.map(d => `- ${d.item_id}: ${d.decision}${d.comment ? ` (${d.comment})` : ''}`).join('\n')}
` : ''}

Generate a professional reconciliation report with:

1. **Executive Summary** (2-3 sentences)
   - High-level overview of reconciliation results
   - Key takeaways for management

2. **Processing Statistics**
   - Total shipments, matches, discrepancies, confidence
   - Presented clearly with percentages

3. **Successfully Matched Shipments**
   - Brief mention of clean shipments
   - Emphasize high confidence rate

4. **Discrepancies Identified**
   - Each discrepancy with details
   - Severity level
   - Recommended resolution

5. **Process Recommendations**
   - 2-3 actionable improvements based on discrepancy patterns
   - Focus on preventing future issues

Write in professional business tone. Be specific with data. Use clear section headings.

Return JSON format:
{
  "title": "report title",
  "executiveSummary": "2-3 sentence summary",
  "statistics": {
    "totalProcessed": number,
    "cleanMatches": number,
    "discrepanciesFound": number,
    "avgConfidence": number
  },
  "cleanShipments": ["list of clean shipment IDs"],
  "discrepancyDetails": [
    {
      "shipment_id": "ID",
      "issue": "description",
      "severity": "level",
      "recommendation": "action"
    }
  ],
  "recommendations": ["improvement 1", "improvement 2", "improvement 3"]
}

Only return valid JSON, no markdown formatting.`;

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
    throw new Error('Could not parse report response');
  } catch (error) {
    console.error('Error generating report:', error);
    // Return fallback report
    return {
      title: 'Shipping Reconciliation Report',
      executiveSummary: `Reconciliation processed ${result.totalProcessed} shipments with ${result.totalFlagged} discrepancies detected. Average data confidence: ${result.avgConfidence}%. ${result.clean.length} shipments matched perfectly across all sources.`,
      statistics: {
        totalProcessed: result.totalProcessed,
        cleanMatches: result.clean.length,
        discrepanciesFound: result.totalFlagged,
        avgConfidence: result.avgConfidence,
      },
      cleanShipments: result.clean,
      discrepancyDetails: result.discrepancies.map(d => ({
        shipment_id: d.shipment_id,
        issue: d.details,
        severity: d.severity,
        recommendation: d.recommendedAction,
      })),
      recommendations: [
        'Implement barcode validation at loading dock to catch shortages before dispatch',
        'Add SKU verification step during order fulfillment to prevent variant mix-ups',
        'Review supplier accuracy rates and address chronic discrepancy sources',
      ],
    };
  }
}
