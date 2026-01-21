// ============================================================================
// THEORETICAL DOCUMENT PROCESSING AI SLIDES
// For educational/presentation use - covers ~30 minute window
// ============================================================================

export interface TheoreticalSlide {
  id: string;
  section: string;
  title: string;
  subtitle: string;
  imageOnLeft: boolean;
  content: {
    headline?: string;
    bullets?: string[];
    stats?: Array<{ value: string; label: string }>;
    quote?: { text: string; attribution: string };
    diagram?: string; // SVG reference
  };
  speakerNotes?: string;
  imagePath?: string;
  imagePrompt: string; // For generating slide images
}

// ============================================================================
// SECTION 1: THE PROBLEM (5 minutes, 3 slides)
// ============================================================================

export const theoreticalSlides: TheoreticalSlide[] = [
  {
    id: 'doc-chaos',
    section: 'The Problem',
    title: 'THE DOCUMENT CHAOS',
    subtitle: 'The Hidden Cost of Manual Processing',
    imageOnLeft: true,
    content: {
      headline: 'Every business runs on documents. Most are still processed by hand.',
      bullets: [
        'Invoices arrive as PDFs, emails, faxes, and paper',
        'Bills of Lading buried in email attachments',
        'Delivery receipts in filing cabinets (if you can find them)',
        'Compliance documents scattered across systems',
        'Someone has to read each one, retype the data, hope they got it right',
      ],
      stats: [
        { value: '80%', label: 'of business data is unstructured' },
        { value: '7+ min', label: 'average time to process one document manually' },
        { value: '4%', label: 'human error rate in data entry' },
      ],
    },
    speakerNotes: 'Start with pain that everyone recognizes. Ask: "How many hours does your team spend on paperwork?" Let them feel the problem before showing the solution.',
    imagePrompt: 'Photorealistic image of a stressed office worker at a cluttered desk covered in stacks of paper invoices, receipts, and shipping documents. Computer screen shows a spreadsheet. Coffee cup half empty. Soft office lighting. Papers have visible text/numbers suggesting invoices. Some papers have yellow sticky notes. Modern office background slightly blurred. Style: realistic documentary photography with slight digital glow on the computer screen.',
  },

  {
    id: 'hidden-cost',
    section: 'The Problem',
    title: 'THE REAL NUMBERS',
    subtitle: 'What Manual Processing Actually Costs',
    imageOnLeft: false,
    content: {
      headline: 'Manual document processing is expensive. Most companies don\'t realize how much.',
      stats: [
        { value: '$15-25', label: 'cost to manually process one invoice' },
        { value: '25 days', label: 'average invoice processing cycle' },
        { value: '3.6%', label: 'of invoices contain errors' },
        { value: '2-3 hrs', label: 'to resolve each dispute' },
      ],
      bullets: [
        'Finance teams spend 60% of time on data entry, not analysis',
        'Late payments due to processing delays cost 1-2% in fees',
        'Audit preparation: days of gathering documents that should take minutes',
        'Customer disputes drag on because proof is buried in filing cabinets',
      ],
    },
    speakerNotes: 'Make it concrete. "If you process 1,000 invoices a month at $20 each, that\'s $240,000/year just in processing cost." Let them do the math for their own operation.',
    imagePrompt: 'Photorealistic image of a modern finance office with a large digital display showing a cost breakdown dashboard with red warning indicators. In foreground, hands holding a paper invoice next to a calculator. Background shows filing cabinets and stacked documents. Clean corporate aesthetic with blue and white color scheme. Digital elements have subtle glow suggesting data visualization. Style: business photography with data visualization overlay.',
  },

  {
    id: 'ocr-limits',
    section: 'The Problem',
    title: 'WHY TRADITIONAL OCR ISN\'T ENOUGH',
    subtitle: 'Reading Text vs Understanding Documents',
    imageOnLeft: true,
    content: {
      headline: 'OCR reads text. It doesn\'t understand what it\'s reading.',
      bullets: [
        'Traditional OCR: "I see the characters 1, 0, 0, 0"',
        'No idea if that\'s a quantity, a price, an account number, or a date',
        'Handwritten notes? 60% accuracy at best',
        'Table structures, multi-column layouts? Often garbled',
        'Every vendor formats invoices differently - OCR can\'t adapt',
      ],
      stats: [
        { value: '60%', label: 'OCR accuracy on handwritten content' },
        { value: '95-98%', label: 'IDP accuracy on standard digital documents' },
      ],
    },
    speakerNotes: 'This is the "aha" moment. Traditional OCR is like hiring someone who can read but doesn\'t speak the language. IDP is like hiring a fluent accountant.',
    imagePrompt: 'Split-screen comparison image. Left side: a blurry, pixelated scan of a handwritten form with red X marks showing OCR failures. Right side: a clean digital document with green checkmarks and highlighted extracted data fields. Visual metaphor showing transformation from chaos to clarity. Digital circuit patterns subtly overlaid on the right side. Style: technical infographic with realistic document photography.',
  },

  // ============================================================================
  // SECTION 2: WHAT IS IDP (10 minutes, 6 slides)
  // ============================================================================

  {
    id: 'what-is-idp',
    section: 'What is IDP',
    title: 'INTELLIGENT DOCUMENT PROCESSING',
    subtitle: 'AI That Actually Understands Documents',
    imageOnLeft: false,
    content: {
      headline: 'IDP combines OCR with AI to not just read, but comprehend documents.',
      bullets: [
        'Classification: "This is an invoice from Vendor X"',
        'Extraction: "The total is $4,500, due date is Jan 15, PO# is 12345"',
        'Validation: "This matches our purchase order"',
        'Integration: "Posting to ERP automatically"',
        'Learning: "I\'ve seen this vendor\'s format before - I know where to look"',
      ],
    },
    speakerNotes: 'Walk through the pipeline. Classification → Extraction → Validation → Integration. Each step adds intelligence.',
    imagePrompt: 'Futuristic visualization of AI document processing pipeline. A physical paper invoice floating and transforming into digital data streams. Glowing neural network patterns connect to extracted data fields (vendor name, total, date) displayed as holographic labels. Clean white background with blue and purple digital accents. Style: realistic paper document with sci-fi digital transformation effect, corporate tech aesthetic.',
  },

  {
    id: 'idp-workflow',
    section: 'What is IDP',
    title: 'THE IDP WORKFLOW',
    subtitle: 'From Paper to Actionable Data',
    imageOnLeft: true,
    content: {
      headline: 'Five steps from document arrival to business action.',
      bullets: [
        '1. CAPTURE: Document arrives (email, scan, upload, fax)',
        '2. CLASSIFY: AI identifies document type and routes accordingly',
        '3. EXTRACT: AI pulls out key fields based on document type',
        '4. VALIDATE: Cross-check against business rules and source data',
        '5. INTEGRATE: Push clean data to ERP, trigger workflows, flag exceptions',
      ],
    },
    speakerNotes: 'This is the "how it works" slide. Keep it simple - five steps. The magic is in steps 2-4 where AI replaces human judgment.',
    imagePrompt: 'Horizontal workflow diagram rendered as a 3D isometric illustration. Five connected stages showing: (1) envelope/scanner, (2) AI sorting documents into categories, (3) magnifying glass extracting data fields, (4) checkmark validation badge, (5) connected ERP system icon. Soft shadows, clean white background, blue accent colors. Documents have realistic paper texture. Style: modern tech illustration with depth, blend of realistic and iconographic.',
  },

  {
    id: 'llm-advantage',
    section: 'What is IDP',
    title: 'THE LLM REVOLUTION',
    subtitle: 'Large Language Models Changed Everything',
    imageOnLeft: false,
    content: {
      headline: 'In 2023, document AI got dramatically smarter.',
      bullets: [
        'LLMs understand context, not just patterns',
        '"Invoice Total" vs "Grand Total" vs "Amount Due" - same meaning, different words',
        'Can handle documents never seen before (zero-shot learning)',
        'Understands tables, nested structures, multi-page documents',
        'Can explain WHY it extracted what it extracted',
      ],
      quote: {
        text: 'Recent advancements in AI have led to transformative change in IDP technology, opening up new possibilities for automating documents that could not be automated before.',
        attribution: 'Industry Analysis, 2025',
      },
    },
    speakerNotes: 'This is the "why now" slide. LLMs are the breakthrough. Before: you needed thousands of examples to train. Now: AI understands from context.',
    imagePrompt: 'Abstract visualization of a large language model brain processing documents. Central glowing neural network sphere with document pages orbiting around it. Data streams flowing from documents into the AI core. Soft purple and blue lighting. Some documents show invoices, some show shipping forms. Digital particles and connection lines. Style: cinematic tech visualization, dark background with luminous elements.',
  },

  {
    id: 'doc-types',
    section: 'What is IDP',
    title: 'WHAT WE CAN PROCESS',
    subtitle: 'Any Document, Any Format',
    imageOnLeft: true,
    content: {
      headline: 'Modern IDP handles the full document zoo.',
      bullets: [
        'Invoices & Purchase Orders (any vendor format)',
        'Bills of Lading & Shipping Documents',
        'Delivery Receipts & Proof of Delivery',
        'Contracts & Compliance Certificates',
        'Handwritten Forms & Notes (yes, really)',
        'ID Documents & Foreign Worker Papers',
        'Lab Reports & Quality Certificates',
      ],
    },
    speakerNotes: 'Show the breadth. Every business has their own document types. The point: if humans can read it, AI can too.',
    imagePrompt: 'Grid layout showing 8 different document types arranged like a gallery wall. Each document is photorealistic: invoice with line items, bill of lading form, handwritten receipt with signature, compliance certificate with official stamps, employment contract, lab report with graphs, customs form, delivery receipt with photo. Soft shadows connect them. Subtle digital scan lines overlay each document. Style: documentary photography collage with digital processing hints.',
  },

  {
    id: 'confidence-scoring',
    section: 'What is IDP',
    title: 'CONFIDENCE SCORING',
    subtitle: 'AI Knows When It\'s Uncertain',
    imageOnLeft: false,
    content: {
      headline: 'The critical difference: AI tells you how sure it is.',
      bullets: [
        'Every extracted field gets a confidence score (0-100%)',
        'High confidence (95%+): Auto-process, no human needed',
        'Medium confidence (70-95%): Flag for quick review',
        'Low confidence (<70%): Route to human expert',
        'Over time, the system learns from corrections',
      ],
      stats: [
        { value: '95-98%', label: 'accuracy on standard digital documents' },
        { value: '70-85%', label: 'accuracy on handwritten/scanned docs' },
        { value: '99%+', label: 'with human review on flagged items' },
      ],
    },
    speakerNotes: 'This is key for trust. AI isn\'t black magic - it shows its work. And it knows when to ask for help.',
    imagePrompt: 'Dashboard interface showing document extraction results with confidence scores. Main focus: an invoice with extracted fields highlighted in different colors based on confidence (green for high, yellow for medium, red for low). Side panel shows confidence percentage bars. Clean UI design with data visualization elements. One field showing "98% Confident" another showing "67% - Review Suggested". Style: realistic software interface screenshot with subtle depth.',
  },

  {
    id: 'human-in-loop',
    section: 'What is IDP',
    title: 'HUMAN-IN-THE-LOOP',
    subtitle: 'When AI Defers to Human Expertise',
    imageOnLeft: true,
    content: {
      headline: 'The best AI systems know when to ask for help.',
      bullets: [
        'Low confidence extractions routed to review queue',
        'Humans see the document, AI\'s guess, and why it\'s uncertain',
        'One click to approve, correct, or escalate',
        'Every correction trains the model for next time',
        'Exceptions handled by experts, routine handled by AI',
      ],
      quote: {
        text: 'IDP can reduce error rates by over 52%, dramatically reducing mistakes in data extraction and entry.',
        attribution: 'Docsumo, 2025',
      },
    },
    speakerNotes: 'Emphasize: this isn\'t "AI replacing humans." It\'s AI handling the boring stuff so humans focus on exceptions and decisions.',
    imagePrompt: 'Split scene showing AI and human collaboration. Left: a robotic hand holding a document with question marks above uncertain fields. Right: a human professional at a modern workstation reviewing the flagged item on screen. Connecting line between them shows data flowing. Warm office lighting on human side, cool blue digital glow on AI side. Style: cinematic corporate photography blended with subtle digital elements.',
  },

  // ============================================================================
  // SECTION 3: BUSINESS IMPACT & ROI (8 minutes, 5 slides)
  // ============================================================================

  {
    id: 'market-adoption',
    section: 'Business Impact',
    title: 'THE ADOPTION WAVE',
    subtitle: 'Enterprise AI Has Gone Mainstream',
    imageOnLeft: false,
    content: {
      headline: '2025: Document AI is no longer experimental.',
      stats: [
        { value: '78%', label: 'of enterprises now use AI in business functions' },
        { value: '87%', label: 'of large enterprises have implemented AI solutions' },
        { value: '$17.8B', label: 'projected IDP market by 2032 (was $1.5B in 2022)' },
        { value: '65%', label: 'of Fortune 500 use document automation' },
      ],
      bullets: [
        'Up from 55% AI adoption just one year ago',
        'Process automation leads adoption at 76%',
        'Average enterprise AI investment: $6.5M annually',
      ],
    },
    speakerNotes: 'Make it about social proof. "Your competitors are doing this." The question isn\'t IF but WHEN.',
    imagePrompt: 'Dramatic upward trend visualization. Large glowing growth chart/graph in 3D showing exponential adoption curve from 2020 to 2025. Floating data points with company logos (abstract, not specific brands). Digital cityscape in background representing enterprise. Blue and green accent colors suggesting growth. Numbers floating: 78%, $17.8B. Style: cinematic data visualization with depth and atmosphere.',
  },

  {
    id: 'roi-numbers',
    section: 'Business Impact',
    title: 'THE ROI REALITY',
    subtitle: 'What Companies Actually See',
    imageOnLeft: true,
    content: {
      headline: 'Document AI pays for itself. Fast.',
      stats: [
        { value: '200-300%', label: 'average first-year ROI' },
        { value: '$3.70', label: 'return for every $1 invested in AI' },
        { value: '4x', label: 'faster document processing' },
        { value: '12-18 mo', label: 'typical payback period' },
      ],
      bullets: [
        'One financial firm saved $2.9M annually after IDP adoption',
        'Logistics company: 7 minutes per document → 30 seconds (90%+ reduction)',
        'Insurance claims processing cut by 60%',
        '26-55% productivity gains reported across industries',
      ],
    },
    speakerNotes: 'Numbers people can take to their CFO. "200-300% ROI in year one." That gets budget approved.',
    imagePrompt: 'Financial ROI visualization with before/after comparison. Left side shows a stopwatch at 7 minutes with dollar signs draining away. Right side shows 30 seconds with dollar signs accumulating in a digital vault. Central percentage showing "90% TIME SAVINGS". Professional business graphics with green growth indicators. Coins and currency elements mixed with digital data streams. Style: infographic meets photorealism, clean corporate aesthetic.',
  },

  {
    id: 'industry-cases',
    section: 'Business Impact',
    title: 'INDUSTRY SUCCESS STORIES',
    subtitle: 'Real Results Across Sectors',
    imageOnLeft: false,
    content: {
      headline: 'Every industry has document processing. Every industry benefits.',
      bullets: [
        'FINANCE: 88% prioritizing document automation in 2025',
        'LOGISTICS: 70%+ adopting for customs and shipment tracking',
        'INSURANCE: 67% implementing for underwriting and claims',
        'HEALTHCARE: EHR data extraction reducing admin burden',
        'MANUFACTURING: Quality certificates and supplier documents',
        'AGRICULTURE: Compliance records, COAs, worker documentation',
      ],
    },
    speakerNotes: 'Make it relevant to the room. Greenhouse/agriculture tie-in: compliance records, foreign worker docs, vendor invoices.',
    imagePrompt: 'Six-panel industry mosaic. Each panel shows a different industry scenario: (1) Finance - trading floor with document screens, (2) Logistics - warehouse with shipping manifests, (3) Insurance - claims adjuster with forms, (4) Healthcare - medical records, (5) Manufacturing - quality control with certificates, (6) Agriculture - greenhouse with compliance documents. All connected by glowing data lines in center. Style: documentary photography montage with digital connection overlay.',
  },

  {
    id: 'touchless-invoice',
    section: 'Business Impact',
    title: 'THE "TOUCHLESS" INVOICE',
    subtitle: '50% of Invoices Processed Without Human Touch by 2025',
    imageOnLeft: true,
    content: {
      headline: 'The goal: invoices that process themselves.',
      bullets: [
        'Invoice arrives by email',
        'AI extracts vendor, PO#, line items, totals',
        'System matches to purchase order',
        'Three-way match: PO vs Invoice vs Receipt',
        'If matched: auto-approve, post to ERP, schedule payment',
        'Human only sees exceptions',
      ],
      quote: {
        text: '50% of B2B invoices globally will be automated by 2025.',
        attribution: 'Industry Forecast',
      },
    },
    speakerNotes: 'This is the end state. "Touchless" doesn\'t mean humans disappear - it means they focus on value-add work.',
    imagePrompt: 'Conceptual image of an invoice floating through an automated pipeline. Physical paper invoice enters on left, passes through glowing AI processing nodes, emerges as digital approval stamp on right. Hands gesture at the start but disappear as document moves through pipeline. Clean white and blue aesthetic. Digital checkmarks appear at each stage. Final output shows ERP system icon receiving data. Style: product photography meets tech visualization.',
  },

  {
    id: 'cost-benefit',
    section: 'Business Impact',
    title: 'COST VS BENEFIT ANALYSIS',
    subtitle: 'Understanding the Investment',
    imageOnLeft: false,
    content: {
      headline: 'What it costs vs what you save.',
      bullets: [
        'INITIAL: Software licensing, integration, training',
        'ONGOING: Subscriptions, maintenance, updates',
        'TANGIBLE BENEFITS: Labor savings, faster processing, fewer errors',
        'INTANGIBLE: Competitive advantage, employee satisfaction, audit readiness',
        'HIDDEN SAVINGS: Dispute resolution, late payment fees, compliance penalties',
      ],
      stats: [
        { value: '12-18', label: 'months typical payback' },
        { value: '72%', label: 'of leaders see positive Gen AI returns' },
        { value: '88%', label: 'expect AI budget increases next year' },
      ],
    },
    speakerNotes: 'Be honest about costs. But frame it: "The question isn\'t whether you can afford to do this. It\'s whether you can afford NOT to."',
    imagePrompt: 'Balance scale visualization. Left side: stack of coins/money with "Investment" label showing software icons and training symbols. Right side: much larger stack with "Returns" showing time clocks, happy employees, clean documents. Scale clearly tipping toward returns. Clean infographic style with 3D elements. Green accent on returns side. Style: modern financial illustration with depth and realism.',
  },

  // ============================================================================
  // SECTION 4: PRACTICAL APPLICATIONS (5 minutes, 3 slides)
  // ============================================================================

  {
    id: 'shipping-receiving',
    section: 'Applications',
    title: 'SHIPPING & RECEIVING',
    subtitle: 'The Three-Way Match',
    imageOnLeft: true,
    content: {
      headline: 'Reconciling what was ordered, shipped, and received.',
      bullets: [
        'PURCHASE ORDER: What you ordered from the vendor',
        'BILL OF LADING: What vendor claims they shipped',
        'INVOICE: What vendor is charging you for',
        'DELIVERY RECEIPT: What your team signed for',
        'BARCODE SCANS: What was actually counted at the dock',
        'AI compares all five data sources automatically',
      ],
    },
    speakerNotes: 'This is the demo lead-in. "Let me show you how this works in practice..."',
    imagePrompt: 'Five documents arranged in a star pattern with connecting lines between them. Center shows "AI RECONCILIATION" hub with glowing neural network. Documents include: PO form, BOL shipping document, invoice, signed delivery receipt with signature, tablet showing barcode scan log. Green checkmarks on matched items, red flag on one discrepancy. Style: top-down documentary photography with digital connection overlay and subtle glow effects.',
  },

  {
    id: 'escalation-workflows',
    section: 'Applications',
    title: 'INTELLIGENT ESCALATION',
    subtitle: 'When AI Finds Problems, The Right People Know',
    imageOnLeft: false,
    content: {
      headline: 'Automatic routing based on severity and type.',
      bullets: [
        'MINOR DISCREPANCY (5 units): Log for review, don\'t interrupt',
        'SIGNIFICANT SHORTAGE (50+ units): Alert receiving manager',
        'WRONG PRODUCT: Immediate escalation to operations',
        'CRITICAL SAFETY ISSUE: Notify safety team + management instantly',
        'Each escalation includes: what, where, when, severity, recommended action',
        'Notification sent via email, SMS, or work order system',
      ],
    },
    speakerNotes: 'The point: AI doesn\'t just find problems - it routes them to the right person with the right urgency.',
    imagePrompt: 'Escalation routing diagram. Central document with warning icon, three branching paths leading to different personas: (1) minor - clipboard icon with "Log" label, (2) significant - manager figure with phone notification, (3) critical - multiple figures with red alert symbols. Severity color coding: green/yellow/red on each path. Clean flowchart aesthetic with realistic document photography at start. Style: business process diagram with photorealistic elements.',
  },

  {
    id: 'data-flow',
    section: 'Applications',
    title: 'THE DATA FLOW',
    subtitle: 'From Scattered Sources to Unified Insights',
    imageOnLeft: true,
    content: {
      headline: 'Multiple systems feeding one intelligent data lake.',
      bullets: [
        'SOURCES: ERP, climate systems, labor tracking, finance, sensors',
        'ETL PIPELINE: Clean, transform, standardize data',
        'UNIFIED DATA LAKE: Single source of truth',
        'OUTPUTS: Dashboards, conversational analytics, forecasts',
        'USERS: Leadership sees KPIs, operations gets alerts, growers get predictions',
      ],
    },
    speakerNotes: 'This is the "big picture" slide. Documents are one input. But they connect to everything else.',
    imagePath: '/demo_pack/theoretical/data-flow-diagram.svg', // Reference to SVG
    imagePrompt: 'Horizontal data flow architecture diagram. Left: multiple source icons (database, email, sensor, spreadsheet) labeled "Sources". Middle: funnel/pipeline labeled "ETL" transforming into clean data streams. Center: large glowing "Data Lake" represented as a circular pool of organized data. Right: three output streams leading to dashboard screens, conversation bubble (AI chat), and prediction graph. Clean tech illustration style with blue/purple color scheme. Style: isometric tech architecture with glowing data elements.',
  },

  // ============================================================================
  // SECTION 5: CALL TO ACTION (2 minutes, 2 slides)
  // ============================================================================

  {
    id: 'getting-started',
    section: 'Next Steps',
    title: 'GETTING STARTED',
    subtitle: 'A Practical Implementation Path',
    imageOnLeft: false,
    content: {
      headline: 'You don\'t have to automate everything at once.',
      bullets: [
        'PHASE 1: Pick ONE high-volume document type (usually invoices)',
        'PHASE 2: Pilot with 30-60 day proof of concept',
        'PHASE 3: Measure accuracy, time savings, user feedback',
        'PHASE 4: Expand to additional document types',
        'PHASE 5: Integrate with downstream systems (ERP, workflows)',
        'Timeline: 3-6 months to production value',
      ],
    },
    speakerNotes: 'Make it achievable. "Start small, prove value, expand." Don\'t overwhelm with a 2-year transformation project.',
    imagePrompt: 'Roadmap visualization as a winding path/road from "Today" to "Full Automation". Five milestone markers along the path showing phases. First milestone is larger and highlighted ("Start Here"). Path moves through stylized landscape representing business transformation - from chaotic paper stacks at start to organized digital systems at end. Aerial perspective with warm lighting. Style: stylized 3D map illustration with realistic textures.',
  },

  {
    id: 'demo-intro',
    section: 'Next Steps',
    title: 'SEE IT IN ACTION',
    subtitle: 'Live Demo: Document Processing Pipeline',
    imageOnLeft: true,
    content: {
      headline: 'Theory is good. Let\'s see it work.',
      bullets: [
        'Interactive flowchart showing the full pipeline',
        'Real document types: invoices, BOLs, receipts',
        'AI extraction with confidence scoring',
        'Human review queue for flagged items',
        'Escalation routing in action',
        'Mobile participation - scan QR codes to contribute',
      ],
    },
    speakerNotes: 'Transition to demo. "Now let me show you what this looks like in practice..." Click to enter the interactive demo.',
    imagePrompt: 'Laptop and mobile phone showing the demo application interface. Laptop displays the flowchart pipeline with connected nodes. Phone shows QR code scanner screen. Both devices sitting on a presentation podium with subtle stage lighting. Background suggests conference room or presentation space. Screens glowing with the blue/green color scheme of the app. Style: product photography with presentation context, warm professional lighting.',
  },
];

// ============================================================================
// HELPER: Get all slides for a section
// ============================================================================
export function getSlidesBySection(section: string): TheoreticalSlide[] {
  return theoreticalSlides.filter(s => s.section === section);
}

// ============================================================================
// HELPER: Get section order
// ============================================================================
export const sectionOrder = [
  'The Problem',
  'What is IDP',
  'Business Impact',
  'Applications',
  'Next Steps',
];

// ============================================================================
// STATS SUMMARY (for quick reference)
// ============================================================================
export const keyStats = {
  marketSize: '$17.8B by 2032 (from $1.5B in 2022)',
  adoptionRate: '78% of enterprises use AI (up from 55% a year ago)',
  roi: '200-300% average first-year ROI',
  processingSpeed: '4x faster with IDP vs manual',
  accuracy: '95-98% on standard digital documents',
  errorReduction: '52% fewer errors with IDP',
  touchlessInvoices: '50% of B2B invoices automated by 2025',
  paybackPeriod: '12-18 months typical',
};

// ============================================================================
// SOURCES (for citations)
// ============================================================================
export const sources = [
  { title: 'Document Processing Statistics 2025', url: 'https://sensetask.com/blog/document-processing-statistics-2025/' },
  { title: 'IDP Market Report 2025', url: 'https://www.docsumo.com/blogs/intelligent-document-processing/intelligent-document-processing-market-report-2025' },
  { title: 'Enterprise AI Adoption Statistics', url: 'https://www.secondtalent.com/resources/ai-adoption-in-enterprise-statistics/' },
  { title: 'AI Statistics & Trends 2025', url: 'https://www.fullview.io/blog/ai-statistics' },
  { title: 'State of Enterprise AI 2025 (OpenAI)', url: 'https://cdn.openai.com/pdf/7ef17d82-96bf-4dd1-9df2-228f7f377a29/the-state-of-enterprise-ai_2025-report.pdf' },
  { title: 'IDP Use Cases 2025', url: 'https://www.lindy.ai/blog/intelligent-document-processing-use-cases' },
  { title: 'What is IDP (AWS)', url: 'https://aws.amazon.com/what-is/intelligent-document-processing/' },
];
