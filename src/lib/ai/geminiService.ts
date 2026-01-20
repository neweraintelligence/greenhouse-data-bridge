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

  if (!client) {
    // Return fallback if no client
    return {
      from: context.vendor,
      fromEmail: `shipping@${context.vendor.toLowerCase().replace(/\s+/g, '')}.com`,
      subject: `Shipment Update - ${context.shipmentId || 'Order Confirmation'}`,
      body: `Dear Team,\n\nPlease find the attached documentation for your recent shipment.\n\nBest regards,\n${context.vendor} Team`,
      hasAttachment: true,
    };
  }

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

// Document types supported by the system
export type DocumentType =
  | 'bol'
  | 'training_form'
  | 'incident_report'
  | 'coa'           // Certificate of Analysis
  | 'receipt'       // Expense receipt
  | 'customer_po';  // Customer Purchase Order

// Analyze document image using Gemini Vision
export async function analyzeDocument(
  imageData: string, // Base64 encoded image
  documentType: DocumentType
): Promise<DocumentAnalysisResult> {
  const client = getClient();

  // Fallback if no API key
  if (!client) {
    return generateMockAnalysis(documentType);
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

    coa: `Analyze this Certificate of Analysis (COA) or lab report document and extract:

Product Information:
- Supplier/Lab name
- Product name (e.g., "Beneficial Insects - Aphidius colemani", "Bumblebees", "Fertilizer 20-20-20")
- Lot number / Batch number (CRITICAL - look for formats like LOT-####, BIO-####, BATCH-####)
- Manufacturing date
- Expiration date (CRITICAL for compliance)

Test Results (extract ALL test rows if present):
- Test name (e.g., "Viability", "Purity", "Contamination", "NPK Content")
- Result value (e.g., "98%", "None detected", "Pass")
- Specification/Limit (e.g., ">95%", "<0.1%", "Pass/Fail")
- Status (Pass/Fail/Warning)

Additional:
- Certificate number
- Authorized signature present (yes/no)
- Storage conditions mentioned
- Any warnings or special notes
- Handwritten annotations (read carefully)

CONTEXT: This is for a greenhouse (Big Marble Farms) receiving biological control agents, fertilizers, or growing inputs. CanadaGAP compliance requires traceability of all inputs.`,

    receipt: `Analyze this expense receipt and extract:

Transaction Details:
- Vendor/Merchant name (store, restaurant, gas station, hotel)
- Date of transaction
- Time (if visible)
- Receipt/Transaction number

Financial:
- Subtotal (before tax)
- Tax amount (GST/HST/PST breakdown if shown)
- Total amount (CRITICAL - the final amount paid)
- Tip amount (if applicable, may be handwritten)
- Payment method (Cash, Visa, Mastercard, Amex, Debit)
- Last 4 digits of card (if shown)

Line Items (if itemized):
- Item description
- Quantity
- Unit price
- Item total

Additional:
- Category suggestion (Meals, Lodging, Fuel, Supplies, Travel, Other)
- Currency (CAD assumed unless stated)
- Handwritten notes or annotations
- Receipt condition (clear, faded, partial)

IMPORTANT: Thermal receipts may be faded - note any fields that are unclear. Handwritten tips should be captured even if messy.`,

    customer_po: `Analyze this Customer Purchase Order document and extract:

Customer Information:
- Customer/Company name
- Customer PO number (CRITICAL)
- Contact name
- Contact email/phone
- Billing address
- Shipping address (if different)

Order Details:
- Order date
- Requested delivery/ship date (CRITICAL)
- Shipping method/terms

Line Items (extract ALL items):
- Item/SKU/Product code
- Description (e.g., "Beefsteak Tomatoes", "Mini Cucumbers 12-pack")
- Quantity ordered
- Unit of measure (cases, units, lbs, kg)
- Unit price (customer's stated price)
- Line total

Totals:
- Subtotal
- Shipping/Freight charges
- Tax
- Total order value

Additional:
- Special instructions or notes (CRITICAL - often handwritten)
- Payment terms (Net 30, COD, etc.)
- Handwritten annotations (read carefully - may say "RUSH", "HOLD", corrections)
- PO authorization signature

CONTEXT: This is for Big Marble Farms (greenhouse) receiving orders from retail customers for tomatoes, cucumbers, and peppers.`,
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
    coa: {
      documentType: 'Certificate of Analysis',
      fields: [
        { label: 'Supplier', value: 'BioBest Canada', confidence: 96 },
        { label: 'Product', value: 'Aphidius colemani (Aphid Parasitoid)', confidence: 94 },
        { label: 'Lot Number', value: 'BIO-2025-0142', confidence: 98 },
        { label: 'Manufacturing Date', value: '2025-01-10', confidence: 92 },
        { label: 'Expiration Date', value: '2025-03-10', confidence: 95 },
        { label: 'Test: Viability', value: '98%', confidence: 97 },
        { label: 'Test: Viability Spec', value: '>95%', confidence: 97 },
        { label: 'Test: Viability Status', value: 'Pass', confidence: 99 },
        { label: 'Test: Contamination', value: 'None detected', confidence: 94 },
        { label: 'Test: Contamination Status', value: 'Pass', confidence: 99 },
        { label: 'Certificate Number', value: 'COA-2025-00847', confidence: 91 },
        { label: 'Signature Present', value: 'Yes', confidence: 88 },
        { label: 'Storage Conditions', value: '8-12°C, dark', confidence: 85 },
        { label: 'Handwritten Note', value: 'Checked 1/15 - RC', confidence: 72 },
      ],
      warnings: ['Shelf life is 8 weeks - verify meets minimum 12-week requirement'],
    },
    receipt: {
      documentType: 'Expense Receipt',
      fields: [
        { label: 'Vendor', value: 'Olive Garden', confidence: 96 },
        { label: 'Date', value: '2025-01-15', confidence: 94 },
        { label: 'Time', value: '7:32 PM', confidence: 89 },
        { label: 'Receipt Number', value: '4521-8847', confidence: 87 },
        { label: 'Subtotal', value: '$41.94', confidence: 95 },
        { label: 'Tax (GST)', value: '$2.10', confidence: 93 },
        { label: 'Tax (PST)', value: '$2.94', confidence: 93 },
        { label: 'Tip', value: '$6.00', confidence: 78 },
        { label: 'Total', value: '$52.98', confidence: 92 },
        { label: 'Payment Method', value: 'Visa', confidence: 96 },
        { label: 'Card Last 4', value: '4421', confidence: 94 },
        { label: 'Category', value: 'Meals', confidence: 90 },
        { label: 'Handwritten Note', value: 'Client dinner - Sobeys buyer', confidence: 68 },
      ],
      warnings: ['Tip appears handwritten - verify amount', 'Meal exceeds $40 per diem policy'],
    },
    customer_po: {
      documentType: 'Customer Purchase Order',
      fields: [
        { label: 'Customer', value: 'Fresh Grocers Ltd', confidence: 97 },
        { label: 'PO Number', value: 'PO-78432', confidence: 99 },
        { label: 'Contact', value: 'Maria Santos', confidence: 91 },
        { label: 'Contact Email', value: 'msantos@freshgrocers.ca', confidence: 88 },
        { label: 'Order Date', value: '2025-01-18', confidence: 95 },
        { label: 'Requested Ship Date', value: '2025-01-22', confidence: 93 },
        { label: 'Item 1: Product', value: 'Beefsteak Tomatoes', confidence: 96 },
        { label: 'Item 1: Qty', value: '50 cases', confidence: 97 },
        { label: 'Item 1: Unit Price', value: '$24.50', confidence: 94 },
        { label: 'Item 2: Product', value: 'Mini Cucumbers 12-pack', confidence: 95 },
        { label: 'Item 2: Qty', value: '30 cases', confidence: 96 },
        { label: 'Item 2: Unit Price', value: '$18.00', confidence: 89 },
        { label: 'Item 3: Product', value: 'Sweet Bell Peppers Mixed', confidence: 94 },
        { label: 'Item 3: Qty', value: '20 cases', confidence: 95 },
        { label: 'Item 3: Unit Price', value: '$22.00', confidence: 91 },
        { label: 'Subtotal', value: '$2,205.00', confidence: 88 },
        { label: 'Total', value: '$2,205.00', confidence: 90 },
        { label: 'Payment Terms', value: 'Net 30', confidence: 92 },
        { label: 'Handwritten Note', value: 'RUSH - need by Friday AM', confidence: 75 },
      ],
      warnings: ['Cucumber unit price ($18.00) differs from price list ($19.50)', 'Handwritten "RUSH" annotation detected'],
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

  if (!client) {
    // Return fallback if no client
    return {
      subject: `URGENT: ${discrepancy.type.replace(/_/g, ' ')} on ${discrepancy.shipment_id}`,
      body: `Dear Operations Team,\n\nWe have detected a ${discrepancy.severity} severity discrepancy on shipment ${discrepancy.shipment_id}.\n\n${discrepancy.details}\n\nExpected: ${discrepancy.expected}\nActual: ${discrepancy.actual}\n\nRecommended Action: ${discrepancy.recommendedAction}\n\nPlease address this issue immediately.\n\nBest regards,\nData Reconciliation System`,
    };
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
    console.error('Error generating escalation email:', error);
    // Return fallback
    return {
      subject: `URGENT: ${discrepancy.type.replace(/_/g, ' ')} on ${discrepancy.shipment_id}`,
      body: `Dear Operations Team,\n\nWe have detected a ${discrepancy.severity} severity discrepancy on shipment ${discrepancy.shipment_id}.\n\n${discrepancy.details}\n\nExpected: ${discrepancy.expected}\nActual: ${discrepancy.actual}\n\nRecommended Action: ${discrepancy.recommendedAction}\n\nPlease address this issue immediately.\n\nBest regards,\nData Reconciliation System`,
    };
  }
}

// ============================================
// CANADAGAP KNOWLEDGE QUERY
// ============================================

export interface ComplianceQueryResult {
  answer: string;
  sections: Array<{
    sectionNumber: string;
    title: string;
    relevance: string;
  }>;
  compliant: 'yes' | 'no' | 'partial' | 'unknown';
  recommendations: string[];
}

// Key excerpts from CanadaGAP Greenhouse Manual v10.0 for context
const CANADAGAP_CONTEXT = `
CanadaGAP Food Safety Manual for Greenhouse Product - Version 10.0 (2023)

SECTION 4: INPUTS

4.1 Water
- 4.1.1: Water used for irrigation, mixing pesticides, or post-harvest washing must be potable or tested annually
- 4.1.2: Water test results must be documented and kept on file for 2 years
- 4.1.3: If water treatment is used, records of treatment must be maintained

4.2 Fertilizers and Soil Amendments
- 4.2.1: All fertilizers must be food-grade or approved for use on food crops
- 4.2.2: Certificates of Analysis (COAs) must be obtained from suppliers for all fertilizers
- 4.2.3: Fertilizer storage must be separate from pesticides and in a clean, dry area
- 4.2.4: Application records must include date, product, rate, location, and applicator

4.3 Crop Protection Products (Pesticides and Biological Controls)
- 4.3.1: All pesticides must be registered for use in Canada and approved for the crop
- 4.3.2: Biological control agents (beneficial insects, mites, nematodes) must have documentation of:
  * Product name and active ingredient/species
  * Supplier name and contact information
  * Lot/batch number for traceability
  * Date of receipt
  * Certificate of Analysis showing viability/purity testing
  * Expiration date (minimum 90-day shelf life recommended at receipt)
  * Storage conditions followed
- 4.3.3: Application records for biological controls must include release date, location, quantity, and operator
- 4.3.4: Integrated Pest Management (IPM) program must be documented

4.4 Seeds and Propagation Materials
- 4.4.1: Seeds must be purchased from reputable suppliers
- 4.4.2: Seed lot numbers must be recorded for traceability
- 4.4.3: Treated seeds must be clearly labeled and stored separately

SECTION 5: GROWING AND HARVESTING

5.1 Growing Practices
- 5.1.1: Greenhouse environment must be monitored and records maintained (temperature, humidity)
- 5.1.2: Worker hygiene practices must be documented and enforced

5.2 Harvesting
- 5.2.1: Harvest containers must be clean and food-grade
- 5.2.2: Harvest date, lot number, and quantity must be recorded

SECTION 6: POST-HARVEST

6.1 Packing and Storage
- 6.1.1: Packing area must be clean and separate from growing areas
- 6.1.2: Temperature monitoring records must be maintained for coolers

6.2 Traceability
- 6.2.1: One-step-up, one-step-down traceability is required
- 6.2.2: Lot codes must link product to inputs, growing location, and harvest date
- 6.2.3: Traceability records must be kept for 2 years minimum

SECTION 7: DOCUMENTATION AND RECORDS

7.1 Record Keeping
- 7.1.1: All required records must be legible, dated, and signed
- 7.1.2: Records must be kept for minimum 2 years
- 7.1.3: Records must be available for audit within 24 hours

7.2 Corrective Actions
- 7.2.1: Non-conformances must be documented with corrective action taken
- 7.2.2: Root cause analysis required for recurring issues
`;

export async function queryCanadaGAPCompliance(
  question: string,
  context?: {
    documentData?: Record<string, string>;
    lotNumber?: string;
    productType?: string;
  }
): Promise<ComplianceQueryResult> {
  const client = getClient();

  const contextDetails = context ? `
Additional Context:
- Document data: ${JSON.stringify(context.documentData || {})}
- Lot number: ${context.lotNumber || 'Not specified'}
- Product type: ${context.productType || 'Not specified'}
` : '';

  const prompt = `You are a CanadaGAP compliance expert for greenhouse operations. Answer the following question using the CanadaGAP manual excerpts provided.

CANADAGAP MANUAL REFERENCE:
${CANADAGAP_CONTEXT}

USER QUESTION:
${question}
${contextDetails}

Provide a detailed answer that:
1. Directly addresses the question
2. Cites specific CanadaGAP section numbers
3. Determines compliance status (yes/no/partial/unknown)
4. Provides actionable recommendations

Respond in JSON format:
{
  "answer": "Detailed answer to the question with specific citations",
  "sections": [
    {"sectionNumber": "4.3.2", "title": "Section title", "relevance": "Why this section applies"}
  ],
  "compliant": "yes|no|partial|unknown",
  "recommendations": ["Specific action items"]
}

Only return valid JSON, no markdown formatting.`;

  if (!client) {
    // Return helpful fallback based on common questions
    if (question.toLowerCase().includes('coa') || question.toLowerCase().includes('certificate')) {
      return {
        answer: "According to CanadaGAP Section 4.3.2, all biological control agents must have a Certificate of Analysis (COA) that includes: product name, supplier information, lot/batch number, date of receipt, viability/purity testing results, expiration date, and storage conditions. A minimum 90-day shelf life is recommended at time of receipt. [Demo mode - connect Gemini API for full analysis]",
        sections: [
          { sectionNumber: '4.3.2', title: 'Biological Control Agents', relevance: 'Primary requirement for COA documentation' },
          { sectionNumber: '6.2.1', title: 'Traceability', relevance: 'Lot number traceability requirements' },
        ],
        compliant: 'unknown',
        recommendations: [
          'Verify COA includes all required fields per Section 4.3.2',
          'Check expiration date meets 90-day minimum shelf life',
          'Ensure lot number is recorded in receiving log for traceability',
        ],
      };
    }
    return {
      answer: "Please connect the Gemini API for full CanadaGAP compliance analysis. The system can answer questions about Sections 4-7 covering inputs, growing/harvesting, post-harvest, and documentation requirements.",
      sections: [],
      compliant: 'unknown',
      recommendations: ['Configure VITE_GEMINI_API_KEY for full functionality'],
    };
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
    throw new Error('Could not parse compliance response');
  } catch (error) {
    console.error('Error querying CanadaGAP compliance:', error);
    return {
      answer: 'Unable to process compliance query. Please try again.',
      sections: [],
      compliant: 'unknown',
      recommendations: [],
    };
  }
}

// ============================================
// AI CHAT ASSISTANT
// ============================================

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatContext {
  useCase: string;
  sessionCode: string;
  processedDocuments?: Array<{
    type: string;
    fields: Record<string, string>;
  }>;
  discrepancies?: Array<{
    type: string;
    severity: string;
    details: string;
  }>;
  extractedData?: Record<string, unknown>;
}

export interface ChatResponse {
  message: string;
  suggestedActions?: Array<{
    label: string;
    action: string;
  }>;
  draftEmail?: {
    to: string;
    subject: string;
    body: string;
  };
}

export async function chat(
  userMessage: string,
  history: ChatMessage[],
  context: ChatContext
): Promise<ChatResponse> {
  const client = getClient();

  const historyText = history
    .slice(-10) // Last 10 messages for context
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const contextText = `
Current Session: ${context.sessionCode}
Use Case: ${context.useCase}
${context.processedDocuments ? `Processed Documents: ${JSON.stringify(context.processedDocuments)}` : ''}
${context.discrepancies ? `Discrepancies Found: ${JSON.stringify(context.discrepancies)}` : ''}
${context.extractedData ? `Extracted Data: ${JSON.stringify(context.extractedData)}` : ''}
`;

  const prompt = `You are an AI assistant for Big Marble Farms' document processing system. You help users:
1. Understand processed documents and extracted data
2. Query and analyze data from the current session
3. Draft emails to suppliers, customers, or internal teams
4. Answer questions about compliance (CanadaGAP) when relevant
5. Suggest next actions based on discrepancies found

CONTEXT:
${contextText}

CONVERSATION HISTORY:
${historyText}

USER MESSAGE:
${userMessage}

Respond helpfully and concisely. If the user asks to draft an email, include it in the response.
If there are obvious next actions, suggest them.

For leadership audience (COO, Ops Manager, etc.), focus on:
- Business impact and ROI
- Time savings
- Compliance status
- Action items

Respond in JSON format:
{
  "message": "Your helpful response",
  "suggestedActions": [
    {"label": "Action button text", "action": "action_id"}
  ],
  "draftEmail": {
    "to": "recipient",
    "subject": "subject line",
    "body": "email body"
  }
}

The draftEmail field is optional - only include if user asks for an email.
suggestedActions is optional - only include if there are clear next steps.
Only return valid JSON, no markdown formatting.`;

  if (!client) {
    // Provide helpful fallback responses
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('email') || lowerMessage.includes('draft')) {
      return {
        message: "I can help draft an email. What would you like to communicate and to whom? For example: 'Draft an email to the supplier about the short shelf life issue.'",
        suggestedActions: [
          { label: 'Draft supplier inquiry', action: 'draft_supplier_email' },
          { label: 'Draft internal escalation', action: 'draft_escalation' },
        ],
      };
    }

    if (lowerMessage.includes('discrepanc') || lowerMessage.includes('issue') || lowerMessage.includes('problem')) {
      return {
        message: `Based on the current session, I found ${context.discrepancies?.length || 0} discrepancies. The most common issues are shelf life warnings and price mismatches. Would you like me to summarize them or draft a communication?`,
        suggestedActions: [
          { label: 'View all discrepancies', action: 'view_discrepancies' },
          { label: 'Draft supplier email', action: 'draft_supplier_email' },
        ],
      };
    }

    if (lowerMessage.includes('compliance') || lowerMessage.includes('canadagap') || lowerMessage.includes('audit')) {
      return {
        message: "I can help with CanadaGAP compliance questions. The documents processed today show all required COA fields are present. However, one lot has only 8 weeks shelf life remaining (Section 4.3.2 recommends 90 days minimum). Would you like details?",
        suggestedActions: [
          { label: 'Check compliance status', action: 'check_compliance' },
          { label: 'Generate audit report', action: 'generate_audit_report' },
        ],
      };
    }

    return {
      message: "I'm your AI assistant for document processing. I can help you:\n• Summarize processed documents\n• Query data from this session\n• Draft emails to suppliers or customers\n• Check CanadaGAP compliance\n• Explain discrepancies found\n\nWhat would you like to know?",
      suggestedActions: [
        { label: 'Summarize session', action: 'summarize' },
        { label: 'Check compliance', action: 'check_compliance' },
      ],
    };
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
    throw new Error('Could not parse chat response');
  } catch (error) {
    console.error('Error in chat:', error);
    return {
      message: "I'm having trouble processing that request. Could you try rephrasing your question?",
    };
  }
}
