import type { NodeInfo } from '../components/flowchart/InfoOverlay';

// ============================================================================
// SHIPPING & RECEIVING USE CASE
// ============================================================================
export const shippingNodeInfo: Record<string, NodeInfo> = {
  outlook: {
    id: 'outlook',
    title: 'PRE-ARRIVAL NOTIFICATION',
    subtitle: 'Shipment Alert Emails',
    imageOnLeft: false, // Text on left, image on right
    description:
      'Think of this as the "heads up" email. When a shipment is created, an automated email goes out with the Bill of Lading PDF showing what\'s supposed to be on the truck.',
    painPoint: 'These emails get buried. By the time someone opens it, the truck already arrived and there\'s a problem.',
    solution: 'System captures every shipment email automatically. No more digging through inboxes.',
    keyInsight: 'This is your early warning system — you know what\'s coming before it arrives.',
    flowContext: {
      inbound: {
        label: 'RECEIVING',
        description: 'RECEIVING MODE: When your vendor ships goods to you, they send an email notification. "500 flats of petunias heading your way on Tuesday."',
        painPoint: 'Vendor emails buried. Truck shows up at your dock — surprise! Your team isn\'t ready.',
        solution: 'Vendor shipment emails captured automatically. Receiving team gets advance notice.',
        keyInsight: 'Prepare your dock crew. Know what\'s arriving before it gets there.',
      },
      outbound: {
        label: 'You ship to customers',
        description: 'SHIPPING MODE: When you ship to a customer, your system sends them an email notification. "Your order is on the truck."',
        painPoint: 'Customer doesn\'t know shipment is coming. Dock not ready. Truck sits. Extra fees.',
        solution: 'Customers notified automatically. Their receiving team is ready when truck arrives.',
        keyInsight: 'Smoother deliveries. Happier customers. Fewer dock delays.',
      },
    },
  },

  onedrive: {
    id: 'onedrive',
    title: 'THE BILLING DOCUMENTS',
    subtitle: 'Invoices',
    imageOnLeft: true, // Image on left, text on right
    description:
      'PDF invoices with line items: SKU codes, descriptions, quantities, unit prices. Someone has to read this, find each item, and manually check if quantities match what was ordered, shipped, and received.',
    painPoint: 'Invoice has 40 line items. Each needs cross-referencing against the order and the barcode scans. Hours of manual work. Miss one line, overbill the customer.',
    solution: 'System reads the PDF, extracts every line item, and automatically matches SKUs and quantities against orders and scans.',
    keyInsight: 'Invoices are complex documents with many items. Automation prevents line-by-line errors.',
    flowContext: {
      inbound: {
        label: 'RECEIVING',
        description: 'RECEIVING MODE: Vendor PDF invoice with dozens of line items. You need to verify each line against what you ordered and what your team scanned at receiving.',
        painPoint: 'Vendor invoice: 15 SKUs, 40 total items. Did you receive everything they\'re charging for? Manual checking takes an hour per invoice.',
        solution: 'Every line item extracted and compared against purchase order and receiving scans. "SKU #1247: Ordered 50, invoiced 50, scanned 48 — shortage flagged."',
        keyInsight: 'Don\'t pay for what you didn\'t receive. Catch it before AP cuts the check.',
      },
      outbound: {
        label: 'Sales orders',
        description: 'SHIPPING MODE: Your invoice to the customer with multiple line items. Each quantity must match what you actually shipped — verified by barcode scans.',
        painPoint: 'You invoice for 12 SKUs totaling 300 units. But warehouse scans show only 285 loaded. Customer will notice and dispute.',
        solution: 'Invoice line items compared against shipping scans. "SKU #3382: Invoiced 50, scanned 45 — adjust invoice before sending."',
        keyInsight: 'Accurate invoicing prevents disputes and maintains customer trust.',
      },
    },
  },

  excel: {
    id: 'excel',
    title: 'THE SYSTEM OF RECORD',
    subtitle: 'The Original Order',
    imageOnLeft: false,
    description:
      'This is the baseline: the order as it exists in your ERP system. Everything downstream gets compared back to this. We treat this as the source of truth.',
    painPoint: 'Important context: This assumes the order was entered correctly. Manual order entry, inventory sync issues, or approval delays can create problems upstream — before this stage.',
    solution: 'For this reconciliation, we pull the order data automatically. What happens BEFORE the order (forecasting, entry accuracy, approval workflows) represents future opportunity.',
    keyInsight: 'Reconciliation quality depends on order accuracy. Upstream optimization is the next frontier.',
    flowContext: {
      inbound: {
        label: 'RECEIVING',
        description: 'Orders you placed with vendors. Pulled from your purchasing system as the expected baseline.',
        painPoint: 'Upstream considerations: Was reorder point calculated correctly? Did someone manually enter quantities? Is inventory count accurate enough to trigger the right order size?',
        solution: 'For now: we use the PO as-is to verify vendor delivery. Upstream: automated reordering based on real-time inventory and demand forecasting.',
        keyInsight: 'Better order creation = better reconciliation outcomes.',
      },
      outbound: {
        label: 'Sales orders',
        description: 'SHIPPING MODE: Customer orders pulled from your order management system. Treated as the fulfillment target.',
        painPoint: 'Upstream considerations: Was order entered correctly? Did inventory show available when it wasn\'t? Did pricing apply correctly? Errors here cascade downstream.',
        solution: 'For now: we use the sales order to verify fulfillment. Upstream: automated order capture from web forms, real-time inventory checks, dynamic pricing validation.',
        keyInsight: 'Order accuracy at creation prevents fulfillment problems later.',
      },
    },
  },

  barcode: {
    id: 'barcode',
    title: 'REAL-TIME DOCK VERIFICATION',
    subtitle: 'Barcode Scans',
    imageOnLeft: true,
    description:
      'Handheld scanners at the dock. Each pallet scanned creates a digital record: shipment ID, SKU, timestamp, and which worker did the scan. This log is the physical proof — not estimates, not paperwork, actual scans.',
    painPoint: 'Invoice lists 15 SKUs with different quantities. Warehouse says "we loaded it all" — but did they? No proof until customer complains.',
    solution: 'Every item scanned as it moves. Digital tally: SKU-1247 (48 units), SKU-3382 (45 units). Compare directly to invoice.',
    keyInsight: 'This is where you catch the short-shipment — in real-time at the dock, not weeks later.',
    flowContext: {
      inbound: {
        label: 'RECEIVING',
        description: 'RECEIVING MODE: Workers scan items off vendor trucks. Each scan tallies toward the SKU total to verify against the vendor invoice.',
        painPoint: 'Vendor invoice: SKU-1247 shows 50 units. Workers scan pallets: only 48 scanned. Are you being shorted?',
        solution: 'Scan log auto-tallies by SKU. "SKU-1247: Expected 50, scanned 48 — 2 unit shortage." Flag before driver leaves.',
        keyInsight: 'Refuse delivery or document shortage while driver is still there. Don\'t discover it later.',
      },
      outbound: {
        label: 'Loading dock scans',
        description: 'SHIPPING MODE: Workers scan items onto customer-bound trucks. Scan log proves what actually shipped for each SKU.',
        painPoint: 'Customer invoice: SKU-3382 shows 50 units. Workers scan pallets: only 45 loaded. Customer will complain about shortage.',
        solution: 'Scan log tallies by SKU. "SKU-3382: Should ship 50, scanned 45 — warehouse shorted 5." Catch before truck leaves.',
        keyInsight: 'Fix load errors before dispatch. Customer gets complete orders.',
      },
    },
  },

  paper: {
    id: 'paper',
    title: 'PROOF SOMEONE RECEIVED IT',
    subtitle: 'Signed Receipt',
    imageOnLeft: false,
    description:
      'The delivery receipt with a signature. Driver hands over goods, gets someone to sign confirming they received it, snaps a photo.',
    painPoint: 'Customer disputes the shipment. You spend 30 minutes digging through filing cabinets looking for the signed receipt.',
    solution: 'Driver uploads the photo immediately. Receipt is linked to the shipment. Pull it up in 5 seconds.',
    keyInsight: 'The signature closes the loop. If there\'s a dispute, this is your proof.',
    flowContext: {
      inbound: {
        label: 'RECEIVING',
        description: 'Your receiving staff signs vendor delivery receipts.',
        painPoint: 'Vendor claims they delivered 500 flats. Did your team sign for 500? Or note a discrepancy?',
        solution: 'Your signature and any handwritten notes captured immediately. "Received 480, 20 damaged" on record.',
        keyInsight: 'Protect yourself: document shortages and damage at delivery.',
      },
      outbound: {
        label: 'Customers sign for deliveries',
        description: 'Customer receiving staff signs your delivery receipts.',
        painPoint: 'Customer claims "we never got it." Where\'s the signed receipt? Filing cabinet? Which drawer?',
        solution: 'Customer signature photo linked to shipment. Proof retrieved in 5 seconds.',
        keyInsight: 'Customer disputes end immediately: "Here\'s your signature."',
      },
    },
  },

  processing: {
    id: 'processing',
    title: 'COMPARING EVERYTHING',
    subtitle: 'The Reconciliation',
    imageOnLeft: true,
    description:
      'The system takes the order, the invoice, the shipment notification, the barcode scans, and the signed receipt — and compares them all. Where they match, great. Where they don\'t, it flags the issue.',
    painPoint: 'Today: Nadine spends 3 hours every week manually comparing spreadsheets. Tired eyes miss rows. Errors slip through.',
    solution: 'System does it in 30 seconds. Perfect accuracy. "Order says 500, scans show 480 — here\'s the problem."',
    keyInsight: 'This is the tedious comparison work that humans hate doing — automated.',
  },

  intake: {
    id: 'intake',
    title: 'WAITING FOR EVERYTHING TO ARRIVE',
    subtitle: 'Data Staging Area',
    imageOnLeft: false,
    description:
      'Think of this like an inbox for data. It shows which pieces have arrived (order data, emails, scans, receipts) and which are still pending. Once everything is ready, reconciliation starts automatically.',
    painPoint: 'Today: "Did we get the invoice? Is the BOL uploaded? Who has the receipt?" Chasing data all day.',
    solution: 'One screen: what\'s ready, what\'s missing. No more chasing.',
    keyInsight: 'Processing happens automatically when data arrives — no manual triggering.',
  },

  output: {
    id: 'output',
    title: 'THE RESULTS',
    subtitle: 'What Needs Attention',
    imageOnLeft: true,
    description:
      'Final report: clean shipments vs. problems. "147 shipments matched perfectly. 12 have discrepancies — here they are, with details on what doesn\'t match."',
    painPoint: 'Executive asks: "How many shipment issues this week?" It takes an hour to figure it out.',
    solution: 'Instant answer. Click for details. Focus on the 12 that need attention, ignore the 147 that are fine.',
    keyInsight: 'Turns chaos into clarity. You know exactly what needs your time.',
  },

  etl: {
    id: 'etl',
    title: 'MAKING DATA COMPARABLE',
    subtitle: 'Data Normalization',
    imageOnLeft: true,
    description:
      'Think of this as translation: converting different formats into one standard so AI can compare apples to apples. Vendors send data in their format, this converts it to yours.',
    painPoint: 'Vendor uses pounds, you track kilograms. BOL shows "1/15/25", database needs ISO format. Vendor SKU codes don\'t match your internal SKUs. Can\'t compare without manual conversion.',
    solution: 'Automatic transformation: units converted, dates standardized, vendor SKUs mapped to internal codes. Every source normalized before comparison.',
    keyInsight: 'Without normalization, you can\'t compare. Garbage in, garbage out. This ensures clean inputs.',
  },

  reviewQueue: {
    id: 'reviewQueue',
    title: 'HUMAN-IN-THE-LOOP',
    subtitle: 'Review Queue',
    imageOnLeft: true,
    description:
      'Items flagged during processing that need human judgment. Low confidence extractions, quantity mismatches, condition issues - anything AI can\'t auto-resolve goes here for your decision.',
    painPoint: 'Issues buried in email, spreadsheets, sticky notes. "Did we resolve that shortage?" No one knows. Follow-up is manual and inconsistent.',
    solution: 'All flagged items in one queue. Click item, see details, make decision (Approve/Reject/Escalate), log it. Nothing forgotten.',
    keyInsight: 'AI handles certainty. Humans handle ambiguity. This is the handoff point.',
  },

  escalation: {
    id: 'escalation',
    title: 'AUTO-ROUTING CRITICAL ISSUES',
    subtitle: 'Escalation Router',
    imageOnLeft: false,
    description:
      'Severity-based intelligent routing. Critical issues (equipment failure, major shortage) escalate immediately to the right team. System knows who needs to know based on issue type and urgency.',
    painPoint: 'Everything funnels to one email inbox. Critical equipment failure sits next to routine check. Urgent buried in noise. Response delayed.',
    solution: 'Auto-routing by severity: Critical → Safety Team (immediate). High → Operations Manager. Medium → Supervisor. Right person, right urgency, every time.',
    keyInsight: 'Escalation shouldn\'t need human triage. Rules-based routing ensures urgent gets urgent treatment.',
  },

  communications: {
    id: 'communications',
    title: 'AUTOMATED FOLLOW-UP',
    subtitle: 'Communications Layer',
    imageOnLeft: true,
    description:
      'Automated notifications sent based on processing results. Escalations trigger emails. Flagged items generate alerts. Decisions logged and communicated. Detection + action, not just detection.',
    painPoint: 'Issue detected, then manual email to notify people. Delays happen. Follow-up forgotten. Loop never closes.',
    solution: 'Instant notifications: Safety emailed on critical. Manager alerted on major discrepancy. Training reminders sent. Automatic, consistent, logged.',
    keyInsight: 'Detection without action is pointless. This closes the loop automatically.',
  },
};

// ============================================================================
// HR TRAINING ACKNOWLEDGEMENTS USE CASE
// ============================================================================
export const trainingNodeInfo: Record<string, NodeInfo> = {
  excel: {
    id: 'excel',
    title: 'EMPLOYEE LIST',
    subtitle: 'Who Needs Training',
    imageOnLeft: false,
    description:
      'The master roster from your HR system: all employees, their departments, hire dates, and which training they need. This is the baseline — who SHOULD complete training.',
    painPoint: 'Today: cross-referencing three spreadsheets to figure out who still needs safety training.',
    solution: 'Single roster automatically compared against all completion records. No manual cross-referencing.',
    keyInsight: 'New hires automatically flagged for required training. Nobody slips through the cracks.',
  },

  'excel-ack': {
    id: 'excel-ack',
    title: 'TRAINING ACKNOWLEDGEMENTS',
    subtitle: 'Completion Records',
    imageOnLeft: true,
    description:
      'Digital records showing which employees completed which training modules, when, and how (in-person, email, online). This is the completion data that gets compared against the roster.',
    painPoint: 'Today: completion data scattered across LMS exports, email confirmations, and paper forms. No single view of who\'s done.',
    solution: 'All completion records in one place. Employee ID links directly to roster. Status per person instantly visible.',
    keyInsight: 'Compare roster (who should be trained) against acknowledgements (who is trained). Gap = overdue employees.',
  },

  paper: {
    id: 'paper',
    title: 'PAPER SIGN-OFF FORMS',
    subtitle: 'Physical Signatures',
    description:
      'The physical forms from in-person training sessions. Employee signs, trainer signs, date is written. These get scanned and uploaded into the system for digital storage.',
    painPoint: 'Today: binders full of paper. "Prove John completed forklift training" means flipping through 200 pages.',
    solution: 'Forms scanned and linked to employee records. Search by name, found in seconds.',
    keyInsight: 'Physical signatures preserved digitally — best of both worlds for compliance.',
  },

  outlook: {
    id: 'outlook',
    title: 'TRAINING COMPLETION EMAILS',
    subtitle: 'Digital Confirmations',
    description:
      'When someone finishes an online training module, the Learning Management System sends an automated email: "John Doe completed Safety 101 on January 15th." This system captures those emails.',
    painPoint: 'Today: completion emails pile up in the HR inbox. Hard to track who\'s done and who\'s missing.',
    solution: 'Emails automatically parsed. Completion data extracted and matched to employees. Inbox becomes a data source.',
    keyInsight: 'No more manual tracking of who completed what.',
  },

  processing: {
    id: 'processing',
    title: 'COMPLIANCE CHECK',
    subtitle: 'Who\'s Current, Who\'s Overdue',
    description:
      'The system matches each employee against all completion records (online, paper, email). It flags who\'s compliant, who\'s overdue, and who\'s missing required training entirely.',
    painPoint: 'Today: before an audit, it\'s panic mode. Hours spent scrambling to confirm everyone\'s status.',
    solution: 'Real-time compliance status. "Show me everyone overdue on safety training" — instant answer with names and dates.',
    keyInsight: 'Proactive reminders instead of reactive scrambling before audits.',
  },

  intake: {
    id: 'intake',
    title: 'RECORD COLLECTION',
    subtitle: 'Gathering All the Data',
    description:
      'Collection point for the employee roster and all forms of completion records before running the compliance check. Shows what\'s been received and what\'s pending.',
    painPoint: 'Today: data scattered across the HR system, learning management system, email, and paper binders. Half the work is just gathering it.',
    solution: 'Single intake point. All sources flow here before processing.',
    keyInsight: 'Processing starts when you\'re ready — no waiting for perfect data.',
  },

  output: {
    id: 'output',
    title: 'COMPLIANCE REPORT',
    subtitle: 'Who\'s Good, Who\'s Not',
    description:
      'The final report: who\'s compliant, who\'s overdue, who\'s missing training. Every name linked to completion dates and proof (signatures, emails, etc.).',
    painPoint: 'Today: auditor asks for proof of compliance. Panic. Hours of scrambling through records.',
    solution: 'One click. Audit-ready report with all proof linked. Names, dates, signatures — everything.',
    keyInsight: 'See completion rates by department at a glance. Know where to focus attention.',
  },
};

// ============================================================================
// INCIDENTS / MAINTENANCE USE CASE
// ============================================================================
export const incidentsNodeInfo: Record<string, NodeInfo> = {
  excel: {
    id: 'excel',
    title: 'BUSINESS RULES & RACI MATRIX',
    subtitle: 'Who Gets Notified? Who Owns It?',
    description:
      'The responsibility matrix for incident handling. Defines incident categories (pest, equipment, safety, contamination), severity levels (1-5), and the RACI for each: Responsible (handles it), Accountable (owns the outcome), Consulted (provides input), Informed (needs to know).',
    painPoint: 'Today: "Who handles pest issues? Is that maintenance or the grower?" Nobody knows who owns what. Critical issues bounce between people.',
    solution: 'Clear ownership in a spreadsheet. Severity 5 → Safety Manager (Maria) is Accountable, Safety Team is Responsible. Severity 3 → Shift Lead is Responsible, Ops Manager is Informed.',
    keyInsight: 'The exception owner (senior manager) gets ALL human-in-the-loop cases. They\'re the backstop when AI is uncertain.',
    imageOnLeft: true,
  },

  paper: {
    id: 'paper',
    title: 'INCIDENT REPORT FORM',
    subtitle: 'Submit What You See',
    description:
      'Mobile form that captures the incident: Reporter signs in with their name. Selects the zone/section where the issue was found. Adds a description. Time is auto-captured. Then uploads photos from their phone\'s gallery — simulated here with pre-seeded CEA incident images.',
    painPoint: 'Today: someone texts a photo to their supervisor with "check this out." No location, no time, no context. Who sent this? When? Where exactly?',
    solution: 'Structured capture: who, what, where, when. Photos attached directly. Everything linked together in one incident record.',
    keyInsight: 'The photo gallery simulates the iPhone camera roll — participant selects from pre-seeded images showing real CEA issues like powdery mildew, aphids, equipment failures.',
  },

  processing: {
    id: 'processing',
    title: 'AI VISION ANALYSIS',
    subtitle: 'Gemini Reads the Photo',
    description:
      'Google Gemini Vision analyzes the uploaded photo. Detects: What type of issue? (pest, equipment, safety). How severe? (1-5). Confidence score. Then looks up the Business Rules to determine routing: who is Responsible? Who is Accountable? Who needs to be Informed?',
    painPoint: 'Today: someone manually reviews every report, classifies it, looks up who handles it, forwards the email. Slow and inconsistent.',
    solution: 'AI classifies in seconds. Rules determine routing. Emails drafted automatically to the right people per the RACI matrix.',
    keyInsight: 'AI + Rules = Consistent triage. Same issue always routes to the same team, regardless of who submitted it.',
  },

  intake: {
    id: 'intake',
    title: 'INCIDENT QUEUE',
    subtitle: 'Reports Coming In',
    description:
      'All submitted incident reports flow here. Watch in real-time as workshop participants scan the QR code and submit reports. Each shows: reporter name, location, timestamp, thumbnail of the photo.',
    painPoint: 'Today: incidents come via email, text, phone calls. No single place to see what\'s been reported.',
    solution: 'One queue. Everything visible. Nothing lost. Real-time updates as reports come in.',
    keyInsight: 'During the demo, you\'ll see this queue populate as people submit reports from their phones.',
  },

  output: {
    id: 'output',
    title: 'INCIDENT DASHBOARD',
    subtitle: 'What Got Routed Where?',
    description:
      'Live view after AI processing: which incidents went to Safety Team, which to Maintenance, which are in Review Queue. See the AI\'s classification, confidence score, and who was notified per the RACI matrix.',
    painPoint: 'Today: "How many open incidents? Who\'s handling the pest issue in Zone 3?" Nobody knows without checking multiple systems.',
    solution: 'One dashboard. Filter by severity, type, status, assigned team. Click any incident for full details including the AI analysis.',
    keyInsight: 'Transparency: see exactly why each incident was routed where it was. Every decision is auditable.',
  },

  reviewQueue: {
    id: 'reviewQueue',
    title: 'HUMAN REVIEW QUEUE',
    subtitle: 'Exception Owner\'s Inbox',
    description:
      'Cases where AI confidence is below 75%, or classification is ambiguous. Goes to the senior manager designated as Exception Owner in the RACI. They see: photo, AI\'s best guess, confidence %, and can confirm, override, or escalate.',
    painPoint: 'Today: ambiguous cases get stuck. "Is this powdery mildew or just dust?" Someone has to make a call but nobody wants to.',
    solution: 'Clear ownership of exceptions. Senior manager is Accountable for all edge cases. They decide, the decision is logged.',
    keyInsight: 'AI handles the clear 80%. The exception owner handles the ambiguous 20%. No cases fall through cracks.',
  },

  escalation: {
    id: 'escalation',
    title: 'ESCALATION EMAILS',
    subtitle: 'Notifications Per RACI',
    description:
      'Auto-drafted emails based on the Business Rules. Severity 5: Safety Manager gets immediate notification with photo + location + AI analysis. Maintenance Lead CC\'d. Operations Director informed. All defined in the RACI spreadsheet.',
    painPoint: 'Today: critical incident sits in someone\'s inbox. "Did Maria see the pest alert?" Nobody knows until they call her.',
    solution: 'Automatic notifications. The RACI defines who gets emailed at each severity level. No manual forwarding needed.',
    keyInsight: 'Mock emails in the demo: safety@bigmarblefarms.com, maintenance.lead@bigmarblefarms.com. See exactly who would be notified.',
  },

  etl: {
    id: 'etl',
    title: 'DATA NORMALIZATION',
    subtitle: 'Standardizing Incident Data',
    imageOnLeft: true,
    description:
      'Incident reports come in different formats: typed descriptions, voice memos transcribed, photos with metadata. This stage standardizes everything: location codes normalized, timestamps in consistent format, severity terms mapped to 1-5 scale.',
    painPoint: 'Today: "Zone 3 Row 12" vs "Z3-R12" vs "greenhouse 3, row twelve" — same location, three different ways to write it. Hard to track patterns.',
    solution: 'Automatic normalization. All locations mapped to standard codes. All severities mapped to 1-5. Consistent data enables pattern detection.',
    keyInsight: 'Clean data in = accurate AI analysis out. Normalization is invisible but critical.',
  },

  communications: {
    id: 'communications',
    title: 'AUTOMATED NOTIFICATIONS',
    subtitle: 'Closing the Loop',
    imageOnLeft: false,
    description:
      'After AI analysis and routing decisions, the system drafts and queues notifications. Safety issues trigger immediate alerts. Maintenance requests generate work orders. All communications logged for audit trail.',
    painPoint: 'Today: detection happens, then someone has to manually email the right people. Delays happen. Sometimes nobody gets notified at all.',
    solution: 'Instant, automatic notifications based on RACI matrix. Right person, right urgency, every time. Complete audit trail of who was notified when.',
    keyInsight: 'The loop isn\'t closed until the right people know about it. This ensures nothing falls through the cracks.',
  },
};

// ============================================================================
// HELPER FUNCTION
// ============================================================================
export function getNodeInfo(
  useCase: string,
  nodeType: string,
  sourceName?: string
): NodeInfo | null {
  const contentMap: Record<string, Record<string, NodeInfo>> = {
    shipping: shippingNodeInfo,
    training: trainingNodeInfo,
    incidents: incidentsNodeInfo,
  };

  const useCaseContent = contentMap[useCase];
  if (useCaseContent) {
    // Special case: Training use case has two excel nodes - route by source name
    if (useCase === 'training' && nodeType === 'excel' && sourceName === 'Acknowledgements') {
      return useCaseContent['excel-ack'] || useCaseContent[nodeType] || null;
    }
    return useCaseContent[nodeType] || null;
  }

  return shippingNodeInfo[nodeType] || null;
}
