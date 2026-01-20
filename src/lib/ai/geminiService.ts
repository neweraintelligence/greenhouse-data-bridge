import { GoogleGenAI } from '@google/genai';

// Initialize Gemini client
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (!genAI) {
    if (!apiKey) {
      console.warn('VITE_GEMINI_API_KEY not set - Gemini features will use fallbacks');
      return null;
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

// Types for document analysis
export interface ExtractedField {
  label: string;
  value: string;
  confidence: number;
}

export interface DocumentAnalysisResult {
  documentType: string;
  fields: ExtractedField[];
  rawText?: string;
  warnings?: string[];
}

export interface EmailGenerationResult {
  from: string;
  fromEmail: string;
  subject: string;
  body: string;
  hasAttachment: boolean;
}

// Generate realistic email content for demo
export async function generateDemoEmail(context: {
  useCase: string;
  vendor: string;
  shipmentId?: string;
}): Promise<EmailGenerationResult> {
  const client = getClient();

  const prompt = `Generate a realistic business email for a greenhouse operations context.

Context:
- Use case: ${context.useCase}
- Vendor/Sender company: ${context.vendor}
${context.shipmentId ? `- Related shipment ID: ${context.shipmentId}` : ''}

Generate a JSON response with:
{
  "from": "Sender Name",
  "fromEmail": "email@company.com",
  "subject": "Email subject line",
  "body": "Full email body with greeting, content, and signature",
  "hasAttachment": true/false
}

Make it sound authentic for a greenhouse/agriculture supply chain context.
Only return valid JSON, no markdown formatting.`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });

    const text = response.text || '';
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Could not parse email response');
  } catch (error) {
    console.error('Error generating email:', error);
    // Return fallback
    return {
      from: context.vendor,
      fromEmail: `shipping@${context.vendor.toLowerCase().replace(/\s+/g, '')}.com`,
      subject: `Shipment Update - ${context.shipmentId || 'Order Confirmation'}`,
      body: `Dear Team,\n\nPlease find the attached documentation for your recent shipment.\n\nBest regards,\n${context.vendor} Team`,
      hasAttachment: true,
    };
  }
}

// Analyze document image using Gemini Vision
export async function analyzeDocument(
  imageData: string, // Base64 encoded image
  documentType: 'bol' | 'training_form' | 'incident_report'
): Promise<DocumentAnalysisResult> {
  const client = getClient();

  // Fallback if no API key
  if (!client) {
    return {
      documentType,
      confidence: 50,
      fields: [
        { label: 'Shipment ID', value: 'DEMO-001', confidence: 50 },
        { label: 'Quantity', value: '42', confidence: 50 },
        { label: 'Condition', value: 'Good condition', confidence: 50 },
        { label: 'Signature', value: 'Present', confidence: 50 },
      ],
      warnings: ['Gemini API not configured - using demo data'],
    };
  }

  const typePrompts: Record<string, string> = {
    bol: `Analyze this Bill of Lading (BOL) document image and extract:
- Carrier name
- Shipment ID / BOL number
- Weight
- Origin address
- Destination address
- Date
- Signature present (yes/no)
- Any special instructions or notes`,

    training_form: `Analyze this training acknowledgement form and extract the following with HIGH ACCURACY:

Employee Information:
- Employee name (CRITICAL: Read handwritten name carefully, common names like John, Sarah, Mike, Maria, Chen, Patel, Rodriguez, Williams, Davis)
- Employee ID (format: EMP-#### or BM-####)

Training Details:
- Training module/topic (e.g., "Safety & SOP", "Forklift Certification")
- Date signed (any format - convert to YYYY-MM-DD if possible)

Signature Analysis (CRITICAL):
- Signature present: yes/no
- If present, attempt to READ the signature and match to employee name
- Signature legibility: clear/unclear/illegible
- Compare signature name to printed employee name - do they match?
- If signature is unclear or doesn't match, flag with LOW confidence (<70%)

Additional:
- Any notes, comments, or annotations
- Form condition (clean, damaged, faded)

IMPORTANT for handwritten signatures:
- Common signature patterns: first initial + last name (e.g., "J. Doe")
- Cursive vs print
- If illegible, still note signature EXISTS but value is "Illegible" with confidence <50%`,

    incident_report: `Analyze this incident report document and extract:
- Location/zone
- Date and time
- Reporter name
- Incident type (equipment, safety, pest, etc.)
- Description of incident
- Severity level (if indicated)
- Photos referenced (yes/no)
- Follow-up required (yes/no)`,
  };

  const prompt = `${typePrompts[documentType]}

For each field, provide:
1. The extracted value
2. A confidence score from 0-100 (how certain you are about the extraction)

If a field is unclear or possibly incorrect, give it a lower confidence score.
If a field is not visible or doesn't exist in the document, use "N/A" as value with 0 confidence.

Respond in JSON format:
{
  "documentType": "type",
  "fields": [
    {"label": "Field Name", "value": "extracted value", "confidence": 85}
  ],
  "warnings": ["any quality issues with the document"]
}

Only return valid JSON, no markdown formatting.`;

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
    throw new Error('Could not parse document analysis response');
  } catch (error) {
    console.error('Error analyzing document:', error);
    // Return mock result for demo purposes
    return generateMockAnalysis(documentType);
  }
}

// Generate mock analysis for demo when API fails
function generateMockAnalysis(documentType: string): DocumentAnalysisResult {
  const mockResults: Record<string, DocumentAnalysisResult> = {
    bol: {
      documentType: 'Bill of Lading',
      fields: [
        { label: 'Carrier', value: 'GreenLine Logistics', confidence: 92 },
        { label: 'Shipment ID', value: 'SHP-2025-0001', confidence: 88 },
        { label: 'Weight', value: '980 lbs', confidence: 75 },
        { label: 'Destination', value: 'BMG Packhouse A', confidence: 85 },
        { label: 'Date', value: '2025-01-06', confidence: 95 },
        { label: 'Signature Present', value: 'Yes', confidence: 90 },
      ],
      warnings: ['Some handwritten text may be partially obscured'],
    },
    training_form: {
      documentType: 'Training Acknowledgement',
      fields: [
        { label: 'Employee Name', value: 'A. Chen', confidence: 88 },
        { label: 'Employee ID', value: 'BM-1001', confidence: 92 },
        { label: 'Training Module', value: 'Safety & SOP', confidence: 95 },
        { label: 'Date Signed', value: '2025-01-23', confidence: 85 },
        { label: 'Signature Present', value: 'Yes', confidence: 78 },
      ],
      warnings: [],
    },
    incident_report: {
      documentType: 'Incident Report',
      fields: [
        { label: 'Location', value: 'Z3-R12', confidence: 82 },
        { label: 'Date/Time', value: '2025-01-24 09:12', confidence: 90 },
        { label: 'Reporter', value: 'Maintenance Team', confidence: 70 },
        { label: 'Incident Type', value: 'Equipment', confidence: 95 },
        { label: 'Severity', value: '4 - Moderate', confidence: 85 },
        { label: 'Follow-up Required', value: 'Yes', confidence: 88 },
      ],
      warnings: ['Photo attachment referenced but not included'],
    },
  };

  return mockResults[documentType] || {
    documentType: 'Unknown',
    fields: [],
    warnings: ['Document type not recognized'],
  };
}

// Validate extracted data against expected schema
export function validateExtraction(
  result: DocumentAnalysisResult,
  requiredFields: string[]
): { valid: boolean; missingFields: string[]; lowConfidenceFields: string[] } {
  const fieldLabels = result.fields.map((f) => f.label.toLowerCase());
  const missingFields = requiredFields.filter(
    (f) => !fieldLabels.includes(f.toLowerCase())
  );

  const lowConfidenceFields = result.fields
    .filter((f) => f.confidence < 50 && f.value !== 'N/A')
    .map((f) => f.label);

  return {
    valid: missingFields.length === 0,
    missingFields,
    lowConfidenceFields,
  };
}

// Generate escalation email for critical discrepancies
export async function generateEscalationEmail(discrepancy: {
  shipment_id: string;
  type: string;
  severity: string;
  expected: string | number;
  actual: string | number;
  difference?: string | number;
  details: string;
  recommendedAction: string;
}): Promise<{ subject: string; body: string }> {
  const client = getClient();

  const prompt = `Draft a professional escalation email for a shipping discrepancy.

Discrepancy Details:
- Shipment ID: ${discrepancy.shipment_id}
- Issue Type: ${discrepancy.type.replace(/_/g, ' ')}
- Severity: ${discrepancy.severity}
- Expected: ${discrepancy.expected}
- Actual: ${discrepancy.actual}
${discrepancy.difference ? `- Difference: ${discrepancy.difference}` : ''}

Issue Description:
${discrepancy.details}

Recommended Action:
${discrepancy.recommendedAction}

Write an urgent but professional email to Operations Manager that:
1. Clearly states the issue in the subject line (keep it concise)
2. Opens with immediate impact statement
3. Provides specific details in bullet format
4. Explains potential business consequences
5. Requests specific action with timeline
6. Maintains professional tone while conveying urgency

Context: Big Marble Farms is a commercial greenhouse. This is a real shipment discrepancy that needs immediate attention.

Return JSON format:
{
  "subject": "concise subject line",
  "body": "email body with proper formatting"
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
    throw new Error('Could not parse email response');
  } catch (error) {
    console.error('Error generating escalation email:', error);
    // Return fallback
    return {
      subject: `URGENT: ${discrepancy.type.replace(/_/g, ' ')} on ${discrepancy.shipment_id}`,
      body: `Dear Operations Team,\n\nWe have detected a ${discrepancy.severity} severity discrepancy on shipment ${discrepancy.shipment_id}.\n\n${discrepancy.details}\n\nExpected: ${discrepancy.expected}\nActual: ${discrepancy.actual}\n\nRecommended Action: ${discrepancy.recommendedAction}\n\nPlease address this issue immediately.\n\nBest regards,\nData Reconciliation System`,
    };
  }
}
