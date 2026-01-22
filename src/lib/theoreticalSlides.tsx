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
  // For interactive SVG slides
  interactiveSvg?: string;
  imagePrompt: string; // For generating slide images
}

// ============================================================================
// SECTION 0: INTRODUCTION (Soft opening - 3 minutes, 2 slides)
// ============================================================================

export const theoreticalSlides: TheoreticalSlide[] = [
  {
    id: 'doc-everywhere',
    section: 'Introduction',
    title: 'DOCUMENTS ARE EVERYWHERE',
    subtitle: 'The Language of Business',
    imageOnLeft: false,
    imagePath: '/demo_pack/theoretical/intro-documents.png',
    content: {
      headline: 'Every business transaction creates a paper trail. Always has, always will.',
      bullets: [
        'Invoices, purchase orders, contracts, receipts',
        'Bills of lading, delivery confirmations, compliance certificates',
        'Emails with attachments, scanned forms, handwritten notes',
        'PDFs, spreadsheets, images, even faxes (yes, still)',
        'Every industry, every size company, every day',
      ],
      stats: [
        { value: '80%', label: 'of business data lives in documents' },
        { value: '1.3M', label: 'Canadian businesses processing documents daily' },
      ],
    },
    speakerNotes: 'Start soft. This isn\'t about problems yet - it\'s about recognizing the universal truth: documents are the lifeblood of commerce. Everyone in the room deals with this.',
    imagePrompt: 'Elegant visualization of various business documents floating in an organized constellation. Invoices, contracts, shipping forms, receipts arranged in a harmonious pattern. Soft lighting, professional aesthetic. Documents appear organized rather than chaotic. Clean white background with subtle blue accents. Some documents show realistic details (numbers, signatures). Style: modern editorial photography with subtle digital glow.',
  },

  {
    id: 'why-favorite',
    section: 'Introduction',
    title: 'THE #1 AI USE CASE',
    subtitle: 'Why Document Processing Leads AI Adoption',
    imageOnLeft: true,
    imagePath: '/demo_pack/theoretical/intro-adoption.png',
    content: {
      headline: 'Document processing isn\'t just popular—it\'s the fastest-adopted AI application in enterprise.',
      bullets: [
        'Clear, measurable ROI (hours saved, errors reduced)',
        'Low risk: AI assists humans, doesn\'t replace judgment',
        'Universal applicability: every department has documents',
        'Proven technology: not experimental, production-ready',
        'Compounds over time: AI learns from every correction',
      ],
      stats: [
        { value: '76%', label: 'of enterprises prioritize process automation' },
        { value: '#1', label: 'AI use case by adoption rate' },
      ],
    },
    speakerNotes: 'Share your genuine enthusiasm. Explain WHY this matters to you personally. The audience connects with passion. This is the "why should I care" slide before diving into problems.',
    imagePrompt: 'Upward trending adoption chart with document AI highlighted as the leader. Clean data visualization showing different AI use cases as bars, with document processing/IDP clearly at the top. Professional blue and green color scheme. Subtle glow on the leading bar. Background suggests enterprise/corporate setting. Numbers floating: 76%, #1. Style: modern business infographic with depth and polish.',
  },

  // ============================================================================
  // SECTION 1: THE PROBLEM (5 minutes, 3 slides)
  // ============================================================================

  {
    id: 'doc-chaos',
    section: 'The Problem',
    title: 'THE DOCUMENT CHAOS',
    subtitle: 'The Hidden Cost of Manual Processing',
    imageOnLeft: true,
    imagePath: '/demo_pack/theoretical/problem-intro.png',
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
        { value: '15 min', label: 'Deliveroo spent per invoice before automation' },
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
    imagePath: '/demo_pack/theoretical/problem-cost.png',
    content: {
      headline: 'Manual document processing is expensive. Most companies don\'t realize how much.',
      stats: [
        { value: '$15-25', label: 'cost to manually process one invoice' },
        { value: '90 min', label: 'Landmark Group spent per purchase order' },
        { value: '3.6%', label: 'of invoices contain errors' },
        { value: '16 days', label: 'Deutsche Bank loan processing time (before)' },
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
    imagePath: '/demo_pack/theoretical/problem-data-silos.png',
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
        { value: '97.6%', label: 'Deliveroo\'s IDP accuracy after implementation' },
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
    imagePath: '/demo_pack/theoretical/idp-definition.png',
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
    interactiveSvg: '/demo_pack/theoretical/idp-workflow-flowchart.svg',
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
    speakerNotes: 'This is the "how it works" slide. Keep it simple - five steps. The magic is in steps 2-4 where AI replaces human judgment. Use the interactive diagram to walk through each step visually.',
    imagePrompt: 'Horizontal workflow diagram rendered as a 3D isometric illustration. Five connected stages showing: (1) envelope/scanner, (2) AI sorting documents into categories, (3) magnifying glass extracting data fields, (4) checkmark validation badge, (5) connected ERP system icon. Soft shadows, clean white background, blue accent colors. Documents have realistic paper texture. Style: modern tech illustration with depth, blend of realistic and iconographic.',
  },

  {
    id: 'llm-advantage',
    section: 'What is IDP',
    title: 'THE LLM REVOLUTION',
    subtitle: 'Large Language Models Changed Everything',
    imageOnLeft: false,
    imagePath: '/demo_pack/theoretical/idp-beyond-ocr.png',
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
        text: 'Wolt processes invoices in 9+ languages across 11 countries with the same team size, handling 30% annual volume growth without adding staff.',
        attribution: 'Wolt (DoorDash subsidiary)',
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
    imagePath: '/demo_pack/theoretical/idp-how-it-works.png',
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
    imagePath: '/demo_pack/theoretical/business-accuracy.png',
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
        { value: '93.4%', label: 'Adyen\'s average extraction accuracy' },
        { value: '82.4%', label: 'Thermo Fisher initial accuracy (targeting 85%+)' },
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
    imagePath: '/demo_pack/theoretical/business-accuracy.png',
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
        text: 'Thermo Fisher achieved 53% straight-through processing - over half of their 824,000 annual invoices need zero human intervention.',
        attribution: 'Thermo Fisher Scientific',
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
    imagePath: '/demo_pack/theoretical/business-scale.png',
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
    imagePath: '/demo_pack/theoretical/business-roi.png',
    content: {
      headline: 'Document AI pays for itself. Fast.',
      stats: [
        { value: '€17M', label: 'Coca-Cola Europacific Partners annual savings' },
        { value: '23x', label: 'Deliveroo efficiency increase' },
        { value: '70%', label: 'Thermo Fisher processing time reduction' },
        { value: '5-12 mo', label: 'Inelo ROI payback period' },
      ],
      bullets: [
        'Coca-Cola CCEP: 580,000 hours recovered (278 working years equivalent)',
        'JPMorgan: 360,000 hours of loan analysis now done in seconds',
        'Deliveroo: Invoice processing from 15 minutes to 45 seconds',
        'First Abu Dhabi Bank: 80,000 hours saved annually on identity verification',
      ],
    },
    speakerNotes: 'These are real companies with published results. The ROI is proven across industries.',
    imagePrompt: 'Financial ROI visualization with before/after comparison. Left side shows a stopwatch at 7 minutes with dollar signs draining away. Right side shows 30 seconds with dollar signs accumulating in a digital vault. Central percentage showing "90% TIME SAVINGS". Professional business graphics with green growth indicators. Coins and currency elements mixed with digital data streams. Style: infographic meets photorealism, clean corporate aesthetic.',
  },

  {
    id: 'industry-cases',
    section: 'Business Impact',
    title: 'REAL SUCCESS STORIES',
    subtitle: 'Named Companies, Verified Results',
    imageOnLeft: false,
    imagePath: '/demo_pack/theoretical/business-scale.png',
    content: {
      headline: 'These aren\'t hypotheticals. These are published case studies.',
      bullets: [
        'COCA-COLA EUROPACIFIC: €800M in orders processed, 99% faster than manual',
        'JPMORGAN CHASE: COiN platform processes loan agreements in seconds vs 360K hours/year',
        'DEUTSCHE BANK: Loan processing from 16 days to 24 hours (93% reduction)',
        'LANDMARK GROUP: Purchase orders from 90 min to 4 min (96% reduction)',
        'ADYEN: 23 countries, any language, with just 7 FTEs in accounts payable',
        'WOLT: 60% automation, 11 countries, 9+ languages, same headcount',
      ],
    },
    speakerNotes: 'Name-drop these companies. They\'re household names or industry leaders. This builds credibility.',
    imagePrompt: 'Six-panel industry mosaic. Each panel shows a different industry scenario: (1) Finance - trading floor with document screens, (2) Logistics - warehouse with shipping manifests, (3) Insurance - claims adjuster with forms, (4) Healthcare - medical records, (5) Manufacturing - quality control with certificates, (6) Agriculture - greenhouse with compliance documents. All connected by glowing data lines in center. Style: documentary photography montage with digital connection overlay.',
  },

  {
    id: 'touchless-invoice',
    section: 'Business Impact',
    title: 'THE "TOUCHLESS" INVOICE',
    subtitle: 'When Automation Just Works',
    imageOnLeft: true,
    imagePath: '/demo_pack/theoretical/applications-invoices.png',
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
        text: 'Thermo Fisher Scientific processes 824,000 invoices annually with 53% requiring zero human intervention.',
        attribution: 'Thermo Fisher Scientific via UiPath',
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
    imagePath: '/demo_pack/theoretical/business-roi.png',
    content: {
      headline: 'What it costs vs what you save.',
      bullets: [
        'INITIAL: Software licensing, integration, training (12 weeks typical design)',
        'ONGOING: Subscriptions, maintenance, updates',
        'TANGIBLE BENEFITS: Labor savings, faster processing, fewer errors',
        'INTANGIBLE: Competitive advantage, employee satisfaction, audit readiness',
        'HIDDEN SAVINGS: Dispute resolution, late payment fees, compliance penalties',
      ],
      stats: [
        { value: '5-12', label: 'months typical payback (Inelo)' },
        { value: '72%', label: 'of leaders see positive Gen AI returns' },
        { value: '20.5%', label: 'Adyen error reduction' },
      ],
    },
    speakerNotes: 'Be honest about costs. But frame it: "The question isn\'t whether you can afford to do this. It\'s whether you can afford NOT to."',
    imagePrompt: 'Balance scale visualization. Left side: stack of coins/money with "Investment" label showing software icons and training symbols. Right side: much larger stack with "Returns" showing time clocks, happy employees, clean documents. Scale clearly tipping toward returns. Clean infographic style with 3D elements. Green accent on returns side. Style: modern financial illustration with depth and realism.',
  },

  // ============================================================================
  // SECTION 4: PRACTICAL APPLICATIONS (5 minutes, 5 slides - includes SVG diagrams)
  // ============================================================================

  {
    id: 'shipping-receiving',
    section: 'Applications',
    title: 'SHIPPING & RECEIVING',
    subtitle: 'The Three-Way Match',
    imageOnLeft: true,
    imagePath: '/demo_pack/theoretical/applications-invoices.png',
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
    imagePath: '/demo_pack/theoretical/applications-compliance.png',
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
    id: 'data-flow-overview',
    section: 'Applications',
    title: 'THE DATA FLOW',
    subtitle: 'From Scattered Sources to Unified Insights',
    imageOnLeft: true,
    imagePath: '/demo_pack/theoretical/applications-greenhouse.png',
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
    speakerNotes: 'This is the "big picture" slide. Documents are one input. But they connect to everything else. Next slides show the detailed architecture.',
    imagePrompt: 'Horizontal data flow architecture diagram. Left: multiple source icons (database, email, sensor, spreadsheet) labeled "Sources". Middle: funnel/pipeline labeled "ETL" transforming into clean data streams. Center: large glowing "Data Lake" represented as a circular pool of organized data. Right: three output streams leading to dashboard screens, conversation bubble (AI chat), and prediction graph. Clean tech illustration style with blue/purple color scheme. Style: isometric tech architecture with glowing data elements.',
  },

  {
    id: 'architecture-detailed',
    section: 'Applications',
    title: 'DATA ARCHITECTURE',
    subtitle: 'The Technical Pipeline',
    imageOnLeft: false,
    content: {
      headline: 'A complete view of how data flows from capture to insight.',
      bullets: [
        'Sources → ETL Pipeline → Data Lake → AI Layer → Users',
        'Each stage adds value and removes noise',
        'Real-time processing for operational data',
        'Batch processing for analytics and reporting',
        'Zoom and explore the diagram to understand each component',
      ],
    },
    speakerNotes: 'This is an interactive diagram. You can zoom in and out to explore the architecture. Use it as a visual aid while explaining.',
    interactiveSvg: '/demo_pack/theoretical/data-flow-diagram.svg',
    imagePrompt: 'Technical architecture diagram showing data pipeline stages.',
  },

  {
    id: 'kpi-transformation',
    section: 'Applications',
    title: 'KPI TRANSFORMATION',
    subtitle: 'From Daily Scramble to Real-Time Intelligence',
    imageOnLeft: true,
    content: {
      headline: 'The before and after of operational visibility.',
      bullets: [
        'BEFORE: Scattered spreadsheets, manual reconciliation, delayed insights',
        'AFTER: Unified data lake, automated processing, same-day visibility',
        'Leadership gets strategic dashboards',
        'Operations gets actionable alerts',
        'Growers get predictive insights',
        'Zero manual reconciliation required',
      ],
    },
    speakerNotes: 'This shows the transformation from current state to future state. Zoom in to explore the specific data sources and outputs.',
    interactiveSvg: '/demo_pack/theoretical/kpi-scramble-future.svg',
    imagePrompt: 'Before/after comparison of KPI management showing transformation from chaos to clarity.',
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
    imagePath: '/demo_pack/theoretical/next-pilot.png',
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
      quote: {
        text: 'Thermo Fisher designed their solution in just 12 weeks and achieved 70% reduction in processing time.',
        attribution: 'Thermo Fisher Scientific',
      },
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
    imagePath: '/demo_pack/theoretical/next-cta.png',
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
  'Introduction',
  'The Problem',
  'What is IDP',
  'Business Impact',
  'Applications',
  'Next Steps',
];

// ============================================================================
// STATS SUMMARY (for quick reference) - Updated with real company data
// ============================================================================
export const keyStats = {
  marketSize: '$17.8B by 2032 (from $1.5B in 2022)',
  adoptionRate: '78% of enterprises use AI (up from 55% a year ago)',
  cocaCola: '€17M savings, 580K hours recovered',
  jpmorgan: '360K hours of work now done in seconds',
  deliveroo: '23x efficiency increase, 97.6% accuracy',
  thermoFisher: '70% time reduction, 53% straight-through processing',
  deutscheBank: '16 days to 24 hours (93% reduction)',
  landmark: '90 min to 4 min per purchase order',
};

// ============================================================================
// COMPANY TESTIMONIALS (for citations)
// ============================================================================
export const companyTestimonials = [
  {
    company: 'Coca-Cola Europacific Partners',
    industry: 'Beverage / Consumer Goods',
    result: '€17M savings, 580,000 hours recovered, 99% faster order processing',
    source: 'SS&C Blue Prism',
  },
  {
    company: 'JPMorgan Chase',
    industry: 'Banking',
    result: '360,000 hours of loan analysis now done in seconds (COiN Platform)',
    source: 'Industry publications',
  },
  {
    company: 'Deliveroo',
    industry: 'Food Delivery',
    result: '23x efficiency increase, 97.6% accuracy, 15 min to 45 sec per invoice',
    source: 'Rossum',
  },
  {
    company: 'Thermo Fisher Scientific',
    industry: 'Life Sciences',
    result: '70% time reduction, 53% straight-through processing, 824K invoices/year',
    source: 'UiPath',
  },
  {
    company: 'Deutsche Bank',
    industry: 'Banking',
    result: 'Loan processing from 16 days to 24 hours',
    source: 'Journal of Banking and Financial Technology',
  },
  {
    company: 'First Abu Dhabi Bank',
    industry: 'Banking',
    result: '88% efficiency increase, 80,000 hours saved on identity verification',
    source: 'UiPath',
  },
  {
    company: 'Landmark Group',
    industry: 'Retail',
    result: 'Purchase orders from 90 min to 4 min, 40-50K hours saved/year',
    source: 'UiPath',
  },
  {
    company: 'Wolt',
    industry: 'Food/Retail Delivery',
    result: '60% automation, 11 countries, 9+ languages, 30% volume growth with same headcount',
    source: 'Rossum',
  },
  {
    company: 'Adyen',
    industry: 'Fintech',
    result: '20.5% error reduction, 93.4% accuracy, 23 countries with 7 FTEs',
    source: 'Rossum',
  },
];

// ============================================================================
// SOURCES (for citations)
// ============================================================================
export const sources = [
  { title: 'Document Processing Statistics 2025', url: 'https://sensetask.com/blog/document-processing-statistics-2025/' },
  { title: 'IDP Market Report 2025', url: 'https://www.docsumo.com/blogs/intelligent-document-processing/intelligent-document-processing-market-report-2025' },
  { title: 'Coca-Cola CCEP Case Study', url: 'https://www.blueprism.com/resources/case-studies/coca-cola-partners-intelligent-automation-transformation/' },
  { title: 'Thermo Fisher Case Study', url: 'https://www.uipath.com/resources/automation-case-studies/document-understanding-reduces-thermo-fisher-scientific-invoice-process' },
  { title: 'Deliveroo Case Study', url: 'https://rossum.ai/customer-stories/deliveroo/' },
  { title: 'First Abu Dhabi Bank Case Study', url: 'https://www.uipath.com/resources/automation-case-studies/first-abu-dhabi-bank-fab' },
  { title: 'Wolt Case Study', url: 'https://rossum.ai/customer-stories/wolt/' },
  { title: 'Adyen Case Study', url: 'https://rossum.ai/customer-stories/adyen/' },
];
