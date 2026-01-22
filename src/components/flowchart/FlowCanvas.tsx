import { useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { SourceNode } from './nodes/SourceNode';
import { IntakeNode } from './nodes/IntakeNode';
import { ProcessingNode } from './nodes/ProcessingNode';
import { OutputNode } from './nodes/OutputNode';
import { UseCaseSelectorNode } from './nodes/UseCaseSelectorNode';
import { ETLNode } from './nodes/ETLNode';
import { ReviewQueueNode } from './nodes/ReviewQueueNode';
import { EscalationNode } from './nodes/EscalationNode';
import { CommunicationsNode } from './nodes/CommunicationsNode';
import { ExpandedNodeModal } from './ExpandedNodeModal';
import { InfoOverlay, type NodeInfo } from './InfoOverlay';
import { DiscrepancyListModal } from '../decisions/DiscrepancyListModal';
import { DiscrepancyDecisionModal } from '../decisions/DiscrepancyDecisionModal';
import { EmailViewerModal } from '../communications/EmailViewerModal';
import { OutlookMiniApp } from './nodes/mini-apps/OutlookMiniApp';
import { OneDriveMiniApp } from './nodes/mini-apps/OneDriveMiniApp';
import { ExcelMiniApp } from './nodes/mini-apps/ExcelMiniApp';
import { PaperScanMiniApp } from './nodes/mini-apps/PaperScanMiniApp';
import { BarcodeScanMiniApp } from './nodes/mini-apps/BarcodeScanMiniApp';
import type { IntakeItem } from './nodes/IntakeNode';
import type { OutputFile } from './nodes/OutputNode';
import type { UseCase } from '../../lib/useCases/types';
import type { EmailItem } from './nodes/mini-apps/OutlookMiniApp';
import type { FileItem } from './nodes/mini-apps/OneDriveMiniApp';
import type { SpreadsheetData } from './nodes/mini-apps/ExcelMiniApp';
import { getAllUseCases } from '../../lib/useCases/registry';
import { getNodeInfo, getNextUseCase, getFirstUseCase } from '../../lib/nodeInfoContent';
import { getNodeImage } from '../../lib/nodeImages';
import { preloadImage, preloadUseCaseImages } from '../../lib/imagePreloader';
import { GlassButton } from '../design-system';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { reconcileShipments } from '../../lib/processing/compareShipments';
import { reconcileQuality } from '../../lib/processing/reconcileQuality';
import { reconcileCustomerOrders } from '../../lib/processing/reconcileCustomerOrders';
import { supabase } from '../../lib/supabase';
import { debug } from '../../lib/debug';
import type { Discrepancy } from '../../lib/processing/types';
import { generatePDF, generateDiscrepancyCSV, generateFullDataCSV, downloadBlob, type SessionParticipation } from '../../lib/reports/exportUtilities';

// Incident type for database records
interface Incident {
  id: string;
  session_code: string;
  incident_type: string;
  severity: number;
  location: string;
  description: string;
  reported_by: string;
  status: string;
  photo_url?: string;
  ai_confidence?: number;
  reported_at: string;
}
import { generateEscalationEmail } from '../../lib/ai/geminiService';
import { generateReconciliationReport, type ReconciliationReport } from '../../lib/ai/reportGenerator';
import { ReportModal } from '../reports/ReportModal';
import { IncidentReportModal, type IncidentReportData } from '../reports/IncidentReportModal';
import { ToastContainer } from '../Toast';
import type { ToastType } from '../Toast';
import { FloatingAIAssistant } from '../ai/FloatingAIAssistant';
import { ParticipantActivityLog } from './ParticipantActivityLog';
import { TheoryPresentation } from '../../pages/TheoryPresentation';
import { CalibrationSlide } from './CalibrationSlide';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: Record<string, any> = {
  source: SourceNode,
  intake: IntakeNode,
  processing: ProcessingNode,
  output: OutputNode,
  useCaseSelector: UseCaseSelectorNode,
  etl: ETLNode,
  reviewQueue: ReviewQueueNode,
  escalation: EscalationNode,
  communications: CommunicationsNode,
};

interface FlowCanvasProps {
  sessionCode: string;
  onProcessComplete?: (stats: { processed: number; flagged: number }) => void;
  startPresentationMode?: boolean;
  onPresentationStart?: () => void;
}

// Demo data generators
function generateDemoEmails(): EmailItem[] {
  return [
    {
      id: '1',
      from: 'GreenLine Logistics',
      fromEmail: 'dispatch@greenline.com',
      subject: 'BOL #SHP-2025-0001 - Shipment Confirmation',
      preview: 'Your shipment has been dispatched and is en route...',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      hasAttachment: true,
      unread: true,
    },
    {
      id: '2',
      from: 'NorthStar Packaging',
      fromEmail: 'orders@northstar.com',
      subject: 'RE: Order #12847 - Delivery Schedule Update',
      preview: 'We have updated the delivery schedule as requested...',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      hasAttachment: false,
      unread: true,
    },
    {
      id: '3',
      from: 'Valley Produce Co.',
      fromEmail: 'shipping@valleyproduce.com',
      subject: 'Invoice #INV-9823 Attached',
      preview: 'Please find attached the invoice for your recent order...',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      hasAttachment: true,
      unread: false,
    },
  ];
}

function generateDemoFiles(): FileItem[] {
  return [
    { id: '1', name: 'Shipments', type: 'folder' },
    { id: '2', name: 'Expected_Shipments_Jan2025.xlsx', type: 'excel', size: '24 KB' },
    { id: '3', name: 'BOL_Template.pdf', type: 'pdf', size: '156 KB' },
    { id: '4', name: 'Carrier_Contacts.xlsx', type: 'excel', size: '12 KB' },
  ];
}

function generateDemoSpreadsheet(): SpreadsheetData {
  return {
    sheetName: 'Expected Shipments',
    headers: ['Ship Date', 'Shipment ID', 'Customer/Vendor', 'SKU', 'Qty'],
    rows: [
      ['2025-01-06', 'OUT-0001', 'Home Depot #4521', 'PET-WAVE-606-PUR', 48],
      ['2025-01-08', 'OUT-0002', 'Green Thumb GC', 'GER-ZON-45-RED', 24],
      ['2025-01-10', 'OUT-0003', 'Lowes #8847', 'PET-STVB-606-PINK', 72],
      ['2025-01-12', 'IN-0001', 'Ball Horticultural', 'PLUG-288-PETWAVE', 20],
      ['2025-01-14', 'IN-0002', 'Sun Gro', 'SUNGRO-PROF-3CF', 150],
    ],
  };
}

function generateTrainingRoster(): SpreadsheetData {
  return {
    sheetName: 'Employee Roster',
    headers: ['Employee ID', 'Name', 'Department', 'Hire Date'],
    rows: [
      ['EMP-1047', 'Sarah Johnson', 'Greenhouse', '2023-03-15'],
      ['EMP-1052', 'Mike Chen', 'Packing', '2023-06-22'],
      ['EMP-1063', 'Maria Rodriguez', 'Shipping', '2024-01-10'],
      ['EMP-1071', 'John Williams', 'Maintenance', '2024-05-08'],
      ['EMP-1089', 'Emily Davis', 'Greenhouse', '2024-09-12'],
    ],
  };
}

function generateTrainingAcknowledgements(): SpreadsheetData {
  return {
    sheetName: 'Training Acknowledgements',
    headers: ['Employee ID', 'Module', 'Date Completed', 'Method'],
    rows: [
      ['EMP-1047', 'Safety & SOP', '2025-01-23', 'In-person'],
      ['EMP-1052', 'Safety & SOP', '', 'Missing'],
      ['EMP-1063', 'Safety & SOP', '2025-01-23', 'In-person'],
      ['EMP-1071', 'Safety & SOP', '2025-01-26', 'Email'],
      ['EMP-1089', 'Safety & SOP', '', 'Pending'],
    ],
  };
}

// Quality use case demo data generators
function generateQualityReceivingLog(): SpreadsheetData {
  return {
    sheetName: 'Receiving Log',
    headers: ['Received', 'Receiving ID', 'Supplier', 'Material', 'Lot #', 'Qty'],
    rows: [
      ['2025-01-13', 'RCV-2025-0001', 'GreenGrow Solutions', '20-20-20 NPK Fertilizer', 'GRE20250110-421', '45 kg'],
      ['2025-01-14', 'RCV-2025-0002', 'BioControl Systems', 'Bacillus thuringiensis (Bt)', 'BIO20250112-187', '12 L'],
      ['2025-01-15', 'RCV-2025-0003', 'AgroChem Canada', 'Neem Oil Concentrate', 'AGR20250108-332', '8 L'],
      ['2025-01-16', 'RCV-2025-0004', 'Prairie Substrates', 'Coco Coir Substrate', 'PRA20250105-094', '25 bag'],
      ['2025-01-17', 'RCV-2025-0005', 'NutriBlend Corp', 'Calcium Nitrate', 'NUT20250115-556', '30 kg'],
      ['2025-01-18', 'RCV-2025-0006', 'GreenGrow Solutions', 'Oxygenated Sanitizer', 'GRE20250116-712', '15 L'],
    ],
  };
}

function generateQualityEmails(): EmailItem[] {
  return [
    {
      id: '1',
      from: 'GreenGrow Solutions',
      fromEmail: 'quality@greengrow.com',
      subject: 'COA for Lot GRE20250110-421 - 20-20-20 NPK',
      preview: 'Please find attached the Certificate of Analysis for your recent order...',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      hasAttachment: true,
      unread: true,
    },
    {
      id: '2',
      from: 'BioControl Systems',
      fromEmail: 'certs@biocontrol.ca',
      subject: 'Quality Certificate - Bt Lot BIO20250112-187',
      preview: 'Attached is the COA and batch documentation for Bacillus thuringiensis...',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      hasAttachment: true,
      unread: true,
    },
    {
      id: '3',
      from: 'AgroChem Canada',
      fromEmail: 'qa@agrochem.ca',
      subject: 'RE: COA Request - Neem Oil Lot AGR20250108-332',
      preview: 'We apologize for the delay. The COA is being processed...',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      hasAttachment: false,
      unread: false,
    },
  ];
}

// Customer Orders use case demo data generators
function generateCustomerOrderList(): SpreadsheetData {
  return {
    sheetName: 'Customer Orders',
    headers: ['Order Date', 'Order ID', 'Customer', 'PO #', 'Total', 'Status'],
    rows: [
      ['2025-01-18', 'ORD-2025-0001', 'Sobeys Western', 'SOB-PO-54321', '$2,847.50', 'Pending'],
      ['2025-01-18', 'ORD-2025-0002', 'Save-On-Foods', 'SAV-PO-88432', '$4,215.00', 'Issue'],
      ['2025-01-19', 'ORD-2025-0003', 'Calgary Co-op', 'CAL-PO-12098', '$1,654.25', 'Pending'],
      ['2025-01-19', 'ORD-2025-0004', 'Superstore Alberta', 'SUP-PO-77654', '$6,890.00', 'Issue'],
      ['2025-01-20', 'ORD-2025-0005', 'Sysco Calgary', 'SYS-PO-34521', '$3,445.75', 'Pending'],
    ],
  };
}

function generatePriceList(): SpreadsheetData {
  return {
    sheetName: 'Price List',
    headers: ['SKU', 'Product', 'Unit Price'],
    rows: [
      ['TOM-BEEF-4LB', 'Beefsteak Tomatoes (4lb)', '$8.99'],
      ['TOM-ROMA-2LB', 'Roma Tomatoes (2lb)', '$5.49'],
      ['TOM-GRAPE-PNT', 'Grape Tomatoes (pint)', '$4.99'],
      ['CUC-ENG-EA', 'English Cucumber (each)', '$2.49'],
      ['CUC-MINI-6PK', 'Mini Cucumbers (6-pack)', '$4.99'],
      ['PEP-BELL-3PK', 'Bell Peppers (3-pack)', '$5.99'],
      ['PEP-BELL-RED', 'Red Bell Pepper (each)', '$2.49'],
    ],
  };
}

function generateCustomerOrderEmails(): EmailItem[] {
  return [
    {
      id: '1',
      from: 'Sobeys Western',
      fromEmail: 'orders@sobeys.ca',
      subject: 'PO# SOB-PO-54321 - Weekly Produce Order',
      preview: 'Please process our attached purchase order for delivery on...',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      hasAttachment: true,
      unread: true,
    },
    {
      id: '2',
      from: 'Save-On-Foods',
      fromEmail: 'produce@saveonfoods.com',
      subject: 'Urgent: PO# SAV-PO-88432 - Large Order',
      preview: 'Confirming our order for the upcoming promotion. Please expedite...',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      hasAttachment: true,
      unread: true,
    },
    {
      id: '3',
      from: 'Sysco Calgary',
      fromEmail: 'procurement@sysco.com',
      subject: 'RE: Standing Order - Weekly Restock',
      preview: 'Attached is our standard weekly order. Please confirm availability...',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      hasAttachment: true,
      unread: false,
    },
  ];
}

export function FlowCanvas({ sessionCode, onProcessComplete, startPresentationMode, onPresentationStart }: FlowCanvasProps) {
  const useCases = getAllUseCases();

  // Selected use case
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase | null>(null);
  const [hasInitialFit, setHasInitialFit] = useState(false);

  // Theory mode state
  const [isTheoryMode, setIsTheoryMode] = useState(false);

  // Calibration slide state (between theory and use cases)
  const [showCalibration, setShowCalibration] = useState(false);

  // Track focused node for focus mode
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  // Track which node is active in presentation (for highlighting)
  const [presentationActiveNode, setPresentationActiveNode] = useState<string | null>(null);

  // Track source statuses
  const [sourceStatuses, setSourceStatuses] = useState<Record<string, 'pending' | 'loading' | 'complete'>>({});

  // Track source data
  const [sourceData, setSourceData] = useState<Record<string, {
    emails?: EmailItem[];
    files?: FileItem[];
    spreadsheet?: SpreadsheetData;
    capturedImage?: string;
    extractedFields?: Array<{ label: string; value: string; confidence: number }>;
  }>>({});

  // Track processing state
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'complete'>('idle');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStats, setProcessingStats] = useState({ processed: 0, flagged: 0, errors: 0 });
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);

  // Track ETL state
  const [etlStatus, setEtlStatus] = useState<'idle' | 'processing' | 'complete'>('idle');
  const [transformations, setTransformations] = useState<Array<{field: string; original: string; transformed: string; type: string}>>([]);

  // Track escalations and communications
  const [escalations, setEscalations] = useState<Array<{id: string; source_type: string; source_id: string; severity: string; routed_to: string; status: string}>>([]);
  const [communications, setCommunications] = useState<Array<{id: string; comm_type: string; recipient: string; subject: string; body?: string; sent_at: string}>>([]);

  // Track live barcode scans (will be used when Barcode Log node displays live updates)
  const [, setLiveScans] = useState<Array<{shipment_id: string; sku: string; qty_scanned: number; scanned_at: string}>>([]);

  // Track incidents (for incidents use case)
  const [incidents, setIncidents] = useState<Incident[]>([]);

  // Track review decisions (from mobile human-in-the-loop)
  const [reviewDecisions, setReviewDecisions] = useState<Array<{
    id: string;
    item_type: string;
    decision: string;
    decided_by: string;
    comment: string | null;
    created_at: string;
  }>>([]);

  // Track review queue items (discrepancies shown on mobile)
  const [reviewQueueItems, setReviewQueueItems] = useState<Array<{
    id: string;
    field_name: string;
    source_a_label: string;
    source_a_value: string;
    source_b_label: string;
    source_b_value: string;
    severity: string;
    status: string;
  }>>([]);

  // Track outputs
  const [outputFiles, setOutputFiles] = useState<OutputFile[]>([]);
  const [reconciliationReport, setReconciliationReport] = useState<ReconciliationReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showIncidentReportModal, setShowIncidentReportModal] = useState(false);
  const [incidentReport, setIncidentReport] = useState<IncidentReportData | null>(null);

  // Track expanded node for modal view
  const [expandedNode, setExpandedNode] = useState<{
    id: string;
    type: 'outlook' | 'onedrive' | 'excel' | 'paper' | 'barcode' | 'camera' | 'ai';
    label: string;
  } | null>(null);

  // Track discrepancy list modal
  const [showDiscrepancyList, setShowDiscrepancyList] = useState(false);
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<Discrepancy | null>(null);

  // Track email viewer modal
  const [selectedEmail, setSelectedEmail] = useState<{id: string; recipient: string; subject: string; body?: string; sent_at: string} | null>(null);

  // Track toasts for notifications
  const [toasts, setToasts] = useState<Array<{id: string; type: ToastType; message: string; duration?: number}>>([]);

  // Auto-pipeline simulation mode
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationRef = useRef<NodeJS.Timeout | null>(null);

  // Track node position overrides from dragging
  const [nodePositionOverrides, setNodePositionOverrides] = useState<Record<string, { x: number; y: number }>>({});

  // Track which node is currently being dragged (for z-index)
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  // Track info overlay
  const [infoOverlayContent, setInfoOverlayContent] = useState<NodeInfo | null>(null);
  const [infoNodeId, setInfoNodeId] = useState<string | null>(null);
  const [infoNodeType, setInfoNodeType] = useState<string | null>(null);
  const [infoNodeLabel, setInfoNodeLabel] = useState<string | null>(null);
  const [infoNodeFetchHandler, setInfoNodeFetchHandler] = useState<(() => void) | null>(null);
  const [infoNodeCanFetch, setInfoNodeCanFetch] = useState(false);

  // Reset node positions to original
  const handleResetPositions = useCallback(() => {
    setNodePositionOverrides({});
  }, []);

  // Handle node drag start - set dragging node for z-index
  const handleNodeDragStart = useCallback((_event: React.MouseEvent, node: Node) => {
    setDraggingNodeId(node.id);
  }, []);

  // Handle node drag end - store the new position and clear dragging state
  const handleNodeDragStop = useCallback((_event: React.MouseEvent, node: Node) => {
    setNodePositionOverrides(prev => ({
      ...prev,
      [node.id]: { x: node.position.x, y: node.position.y }
    }));
    setDraggingNodeId(null);
  }, []);

  // Handle expand node
  const handleExpandNode = useCallback((sourceName: string, sourceType: 'outlook' | 'onedrive' | 'excel' | 'paper' | 'barcode' | 'camera' | 'ai') => {
    // Skip unsupported types (camera, ai)
    if (sourceType === 'camera' || sourceType === 'ai') return;
    setExpandedNode({ id: sourceName, type: sourceType, label: sourceName });
  }, []);

  // Handle discrepancy decision
  const handleDiscrepancyDecision = useCallback(async (
    decision: 'approved' | 'rejected' | 'escalated',
    comment?: string
  ) => {
    if (!selectedDiscrepancy) return;

    try {
      // Save decision to Supabase
      await supabase.from('review_decisions').insert({
        session_code: sessionCode,
        item_type: 'discrepancy',
        item_id: selectedDiscrepancy.id,
        decision,
        decided_by: 'Demo User',
        comment: comment || null,
      });

      // Remove from discrepancies list
      setDiscrepancies(prev => prev.filter(d => d.id !== selectedDiscrepancy.id));

      // Update stats
      setProcessingStats(prev => ({
        ...prev,
        flagged: prev.flagged - 1,
      }));

      debug.log('Decision saved:', decision, selectedDiscrepancy.id);
    } catch (error) {
      debug.criticalError('Decision save failed', error);
    }
  }, [selectedDiscrepancy, sessionCode]);

  // Handle Excel cell edits - save immediately to Supabase
  const handleExcelCellEdit = useCallback(async (rowIndex: number, colIndex: number, newValue: string | number) => {
    if (!selectedUseCase || selectedUseCase.id !== 'shipping') return;

    try {
      // Get current spreadsheet data
      const currentData = sourceData['Expected Shipments'];
      if (!currentData?.spreadsheet) return;

      const row = currentData.spreadsheet.rows[rowIndex];
      if (!row) return;

      // Map column index to field name
      const headers = currentData.spreadsheet.headers;
      const fieldName = headers[colIndex];

      // Get shipment_id from row (column index 1)
      const shipmentId = row[1];

      // Build update object based on field
      const updates: Partial<{expected_qty: number; expected_sku: string; vendor: string; ship_date: string}> = {};
      if (fieldName === 'Qty') {
        updates.expected_qty = Number(newValue);
      } else if (fieldName === 'SKU') {
        updates.expected_sku = String(newValue);
      } else if (fieldName === 'Customer/Vendor') {
        updates.vendor = String(newValue);
      } else if (fieldName === 'Ship Date') {
        updates.ship_date = String(newValue);
      }

      if (Object.keys(updates).length > 0) {
        // Update Supabase
        const { error } = await supabase
          .from('shipments_expected')
          .update(updates)
          .eq('session_code', sessionCode)
          .eq('shipment_id', shipmentId);

        if (error) throw error;

        debug.log('Excel cell updated in database:', shipmentId, updates);

        // Update local state
        const updatedRows = [...currentData.spreadsheet.rows];
        updatedRows[rowIndex] = [...row];
        updatedRows[rowIndex][colIndex] = newValue;

        setSourceData(prev => ({
          ...prev,
          'Expected Shipments': {
            ...currentData,
            spreadsheet: {
              headers: currentData.spreadsheet?.headers || [],
              rows: updatedRows,
              sheetName: currentData.spreadsheet?.sheetName,
            },
          },
        }));
      }
    } catch (error) {
      debug.criticalError('Excel edit save failed', error);
    }
  }, [selectedUseCase, sourceData, sessionCode]);

  // Handle adding a new row to Excel sheet
  const handleAddRow = useCallback(async () => {
    if (!selectedUseCase || selectedUseCase.id !== 'shipping') return;

    try {
      const currentData = sourceData['Expected Shipments'];
      if (!currentData?.spreadsheet) return;

      // Generate new shipment ID (increment from last)
      const existingRows = currentData.spreadsheet.rows;
      const lastShipmentId = existingRows.length > 0 ? String(existingRows[existingRows.length - 1][1]) : 'OUT-2025-0000';
      const match = lastShipmentId.match(/(\d+)$/);
      const nextNumber = match ? parseInt(match[1], 10) + 1 : 1;
      const newShipmentId = `OUT-2025-${String(nextNumber).padStart(4, '0')}`;

      // Create new row with defaults
      const today = new Date().toISOString().split('T')[0];
      const newRow = [
        existingRows.length + 1, // Row number
        newShipmentId,
        'CTN-12OZ', // Default SKU
        100, // Default qty
        'New Customer', // Default vendor
        today,
      ];

      // Insert to Supabase
      const { error } = await supabase.from('shipments_expected').insert({
        session_code: sessionCode,
        shipment_id: newShipmentId,
        expected_sku: 'CTN-12OZ',
        expected_qty: 100,
        vendor: 'New Customer',
        ship_date: today,
        direction: 'outbound',
        notes: 'Added manually',
      });

      if (error) throw error;

      debug.log('New row added to database:', newShipmentId);

      // Update local state
      setSourceData(prev => ({
        ...prev,
        'Expected Shipments': {
          ...currentData,
          spreadsheet: {
            headers: currentData.spreadsheet?.headers || [],
            rows: [...existingRows, newRow],
            sheetName: currentData.spreadsheet?.sheetName,
          },
        },
      }));
    } catch (error) {
      debug.criticalError('Add row failed', error);
    }
  }, [selectedUseCase, sourceData, sessionCode]);

  // Handle show info overlay
  const handleShowInfo = useCallback((
    nodeType: string,
    nodeId: string,
    sourceName: string,
    _sourceIndex: number, // Unused but kept for compatibility
    onActivate?: () => void,
    status?: string,
    useCaseOverride?: string // Optional override for transitions
  ) => {
    const useCaseId = useCaseOverride || selectedUseCase?.id || 'shipping';
    const info = getNodeInfo(useCaseId, nodeType, sourceName);
    if (info) {
      setInfoOverlayContent(info);
      setInfoNodeId(nodeId);
      setInfoNodeType(nodeType);
      setInfoNodeLabel(sourceName);

      // Set as presentation active node for highlighting
      setPresentationActiveNode(nodeId);

      // Store fetch handler for the "Fetch Data" button
      if (onActivate) {
        setInfoNodeFetchHandler(() => onActivate);
      } else {
        setInfoNodeFetchHandler(null);
      }
      // Can fetch if pending and not paper type
      setInfoNodeCanFetch(status === 'pending' && nodeType !== 'paper');
    }
  }, [selectedUseCase]);

  // Toggle simulation
  const toggleSimulation = useCallback(() => {
    setIsSimulating(prev => !prev);
  }, []);

  // Handle theory section selection
  const handleSelectTheory = useCallback(() => {
    setIsTheoryMode(true);
    setSelectedUseCase(null);
    // Clear other state
    setSourceData({});
    setProcessingStatus('idle');
    setProcessingProgress(0);
    setFocusedNodeId(null);
    setPresentationActiveNode(null);
    setIncidents([]);
  }, []);

  // Handle use case selection
  const handleUseCaseSelect = useCallback(async (useCase: UseCase) => {
    setIsTheoryMode(false); // Exit theory mode when selecting a use case
    setSelectedUseCase(useCase);
    // Initialize source statuses for the selected use case
    setSourceStatuses(Object.fromEntries(useCase.sources.map((s) => [s.name, 'pending'])));
    // Initialize output files
    setOutputFiles(useCase.outputTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      type: t.fileType,
      ready: false,
    })));
    // Reset other state
    setSourceData({});
    setProcessingStatus('idle');
    setProcessingProgress(0);
    setFocusedNodeId(null);
    setPresentationActiveNode(null);
    setIncidents([]);

    // Preload all images for this use case in the background
    preloadUseCaseImages(useCase.id).then(count => {
      debug.log(`Preloaded ${count} images for use case: ${useCase.id}`);
    });

    // Fetch incidents if this is the incidents use case
    if (useCase.id === 'incidents' && sessionCode) {
      try {
        const { data, error } = await supabase
          .from('incidents')
          .select('*')
          .eq('session_code', sessionCode)
          .order('reported_at', { ascending: false });

        if (error) {
          debug.log('Error fetching incidents:', error);
        } else if (data) {
          debug.log('Fetched incidents:', data.length);
          setIncidents(data);
        }
      } catch (err) {
        debug.log('Error fetching incidents:', err);
      }
    }

    // Fetch review queue items and decisions for human-in-the-loop (all use cases)
    if (sessionCode) {
      try {
        // Fetch review queue items
        const { data: queueItems } = await supabase
          .from('review_queue_items')
          .select('*')
          .eq('session_code', sessionCode)
          .order('created_at', { ascending: false });

        if (queueItems) {
          setReviewQueueItems(queueItems);
        }

        // Fetch review decisions
        const { data: decisions } = await supabase
          .from('review_decisions')
          .select('*')
          .eq('session_code', sessionCode)
          .order('created_at', { ascending: false });

        if (decisions) {
          setReviewDecisions(decisions);
        }
      } catch (err) {
        debug.log('Error fetching review data:', err);
      }
    }
  }, [sessionCode]);

  // Handle transition to next use case (from "Up Next" slide)
  const handleTransitionToNextUseCase = useCallback(() => {
    if (!selectedUseCase) return;

    const nextUseCase = getNextUseCase(selectedUseCase.id);
    if (!nextUseCase) {
      // No next use case - just close the overlay
      setInfoOverlayContent(null);
      setInfoNodeId(null);
      setInfoNodeType(null);
      setInfoNodeLabel(null);
      return;
    }

    // Find the full use case object
    const useCaseObj = useCases.find(uc => uc.id === nextUseCase.id);
    if (useCaseObj) {
      // Close current overlay
      setInfoOverlayContent(null);
      setInfoNodeId(null);
      setInfoNodeType(null);
      setInfoNodeLabel(null);

      // Select the next use case
      handleUseCaseSelect(useCaseObj);

      // After a short delay, start presentation mode on the first source
      setTimeout(() => {
        if (useCaseObj.sources.length > 0) {
          const firstSource = useCaseObj.sources[0];
          const firstNodeId = `source-${firstSource.name}`;
          handleShowInfo(
            firstSource.type,
            firstNodeId,
            firstSource.name,
            0,
            undefined,
            undefined,
            useCaseObj.id // Pass the new use case ID explicitly
          );
        }
      }, 300);
    }
  }, [selectedUseCase, useCases, handleUseCaseSelect, handleShowInfo]);

  // Build intake items from sources
  const buildIntakeItems = useCallback((): IntakeItem[] => {
    if (!selectedUseCase) return [];
    return selectedUseCase.sources.map((s) => ({
      id: s.name,
      name: s.name,
      received: sourceStatuses[s.name] === 'complete',
      required: !s.optional,
    }));
  }, [selectedUseCase, sourceStatuses]);

  // Handle source activation - fetch REAL data from Supabase
  const handleSourceActivate = useCallback(async (sourceName: string, sourceType: string) => {
    setSourceStatuses((prev) => ({ ...prev, [sourceName]: 'loading' }));
    setFocusedNodeId(`source-${sourceName}`);

    // Simulate loading delay for visibility
    setTimeout(async () => {
      const newData: Record<string, unknown> = {};

      try {
        if (sourceType === 'excel') {
          // Fetch actual orders from Supabase
          if (selectedUseCase?.id === 'shipping') {
            const { data } = await supabase
              .from('shipments_expected')
              .select('ship_date, shipment_id, vendor, expected_sku, expected_qty')
              .eq('session_code', sessionCode)
              .order('ship_date');

            newData.spreadsheet = {
              sheetName: 'Expected Shipments',
              headers: ['Ship Date', 'Shipment ID', 'Customer/Vendor', 'SKU', 'Qty'],
              rows: (data || []).map(s => [
                s.ship_date,
                s.shipment_id,
                s.vendor,
                s.expected_sku,
                s.expected_qty
              ]),
            };
          } else if (selectedUseCase?.id === 'training') {
            newData.spreadsheet = sourceName === 'Acknowledgements'
              ? generateTrainingAcknowledgements()
              : generateTrainingRoster();
          } else if (selectedUseCase?.id === 'quality') {
            // Fetch quality receiving log from Supabase
            const { data } = await supabase
              .from('quality_receiving_log')
              .select('received_date, receiving_id, supplier_name, material_name, lot_number, quantity, unit')
              .eq('session_code', sessionCode)
              .order('received_date');

            if (data && data.length > 0) {
              newData.spreadsheet = {
                sheetName: 'Receiving Log',
                headers: ['Received', 'Receiving ID', 'Supplier', 'Material', 'Lot #', 'Qty'],
                rows: data.map(r => [
                  r.received_date,
                  r.receiving_id,
                  r.supplier_name,
                  r.material_name,
                  r.lot_number,
                  `${r.quantity} ${r.unit}`,
                ]),
              };
            } else {
              newData.spreadsheet = generateQualityReceivingLog();
            }
          } else if (selectedUseCase?.id === 'customer-orders') {
            // Determine which spreadsheet based on source name
            if (sourceName === 'Price List') {
              const { data } = await supabase
                .from('product_price_list')
                .select('sku, product_name, unit_price')
                .eq('session_code', sessionCode);

              if (data && data.length > 0) {
                newData.spreadsheet = {
                  sheetName: 'Price List',
                  headers: ['SKU', 'Product', 'Unit Price'],
                  rows: data.map(p => [p.sku, p.product_name, `$${p.unit_price.toFixed(2)}`]),
                };
              } else {
                newData.spreadsheet = generatePriceList();
              }
            } else if (sourceName === 'Inventory Status') {
              const { data } = await supabase
                .from('product_inventory')
                .select('sku, product_name, available_qty')
                .eq('session_code', sessionCode);

              if (data && data.length > 0) {
                newData.spreadsheet = {
                  sheetName: 'Inventory Status',
                  headers: ['SKU', 'Product', 'Available'],
                  rows: data.map(p => [p.sku, p.product_name, p.available_qty]),
                };
              } else {
                newData.spreadsheet = {
                  sheetName: 'Inventory Status',
                  headers: ['SKU', 'Product', 'Available'],
                  rows: [
                    ['TOM-BEEF-4LB', 'Beefsteak Tomatoes', 450],
                    ['TOM-ROMA-2LB', 'Roma Tomatoes', 320],
                    ['CUC-ENG-EA', 'English Cucumber', 520],
                    ['PEP-BELL-3PK', 'Bell Peppers (3pk)', 150],
                  ],
                };
              }
            } else {
              // Default: Customer orders list
              const { data } = await supabase
                .from('customer_orders')
                .select('order_date, order_id, customer_name, po_number, total_value, status')
                .eq('session_code', sessionCode)
                .order('order_date');

              if (data && data.length > 0) {
                newData.spreadsheet = {
                  sheetName: 'Customer Orders',
                  headers: ['Order Date', 'Order ID', 'Customer', 'PO #', 'Total', 'Status'],
                  rows: data.map(o => [
                    o.order_date,
                    o.order_id,
                    o.customer_name,
                    o.po_number,
                    `$${o.total_value?.toFixed(2) || '0.00'}`,
                    o.status,
                  ]),
                };
              } else {
                newData.spreadsheet = generateCustomerOrderList();
              }
            }
          } else if (selectedUseCase?.id === 'incidents') {
            // Business Rules & RACI Matrix for incident routing
            newData.spreadsheet = {
              sheetName: 'Business Rules & RACI',
              headers: ['Severity', 'Category', 'Responsible', 'Accountable', 'Consulted', 'Informed'],
              rows: [
                ['5 - Critical', 'Safety Hazard', 'Safety Team', 'Maria Santos (Safety Mgr)', 'Ops Director', 'safety@bigmarblefarms.com, ops.director@bigmarblefarms.com'],
                ['5 - Critical', 'Equipment Failure', 'Maintenance Lead', 'Maria Santos (Safety Mgr)', 'Ops Director', 'maintenance.lead@bigmarblefarms.com, safety@bigmarblefarms.com'],
                ['4 - Urgent', 'Pest/Disease', 'Head Grower', 'Roberto Chen (Ops Mgr)', 'Quality Team', 'head.grower@bigmarblefarms.com, quality@bigmarblefarms.com'],
                ['4 - Urgent', 'Equipment Issue', 'Maintenance Team', 'James Wilson (Maint Lead)', 'Shift Lead', 'maintenance@bigmarblefarms.com'],
                ['3 - Moderate', 'Irrigation Leak', 'Shift Lead', 'Roberto Chen (Ops Mgr)', '-', 'shift.lead@bigmarblefarms.com'],
                ['3 - Moderate', 'Environmental', 'Head Grower', 'Roberto Chen (Ops Mgr)', '-', 'head.grower@bigmarblefarms.com'],
                ['2 - Minor', 'Housekeeping', 'Shift Lead', 'Shift Lead', '-', 'Log Only'],
                ['1 - Info', 'General Observation', 'Reporter', 'Shift Lead', '-', 'Log Only'],
                ['Exception Owner', 'ALL Low-Confidence Cases', 'Roberto Chen', 'Roberto Chen (Ops Mgr)', 'Relevant Team', 'ops.manager@bigmarblefarms.com'],
              ],
            };
          } else {
            newData.spreadsheet = generateDemoSpreadsheet();
          }
        } else if (sourceType === 'outlook') {
          if (selectedUseCase?.id === 'quality') {
            // Generate COA emails from quality receiving data
            const { data: receiving } = await supabase
              .from('quality_receiving_log')
              .select('*')
              .eq('session_code', sessionCode)
              .limit(5);

            if (receiving && receiving.length > 0) {
              newData.emails = receiving.slice(0, 3).map((r, i) => ({
                id: String(i + 1),
                from: r.supplier_name,
                fromEmail: `quality@${r.supplier_name.toLowerCase().replace(/\s+/g, '')}.com`,
                subject: `COA for Lot ${r.lot_number} - ${r.material_name}`,
                preview: `Certificate of Analysis attached for your order...`,
                timestamp: new Date(Date.now() - i * 4 * 60 * 60 * 1000).toISOString(),
                hasAttachment: true,
                unread: i < 2,
              }));
            } else {
              newData.emails = generateQualityEmails();
            }
          } else if (selectedUseCase?.id === 'customer-orders') {
            // Generate customer PO emails
            const { data: customerOrders } = await supabase
              .from('customer_orders')
              .select('*')
              .eq('session_code', sessionCode)
              .limit(5);

            if (customerOrders && customerOrders.length > 0) {
              newData.emails = customerOrders.slice(0, 3).map((o, i) => ({
                id: String(i + 1),
                from: o.customer_name,
                fromEmail: o.customer_contact || `orders@${o.customer_name.toLowerCase().replace(/\s+/g, '')}.com`,
                subject: `PO# ${o.po_number} - ${o.status === 'issue' ? 'URGENT: ' : ''}Order Request`,
                preview: `Please process our attached purchase order for delivery...`,
                timestamp: new Date(Date.now() - i * 4 * 60 * 60 * 1000).toISOString(),
                hasAttachment: true,
                unread: i < 2,
              }));
            } else {
              newData.emails = generateCustomerOrderEmails();
            }
          } else {
            // Generate email from actual order data (shipping)
            const { data: orders } = await supabase
              .from('shipments_expected')
              .select('*')
              .eq('session_code', sessionCode)
              .limit(5);

            // Use first order for email demo
            if (orders && orders.length > 0) {
              const order = orders[0];
              newData.emails = [
                {
                  id: '1',
                  from: order.vendor,
                  fromEmail: `orders@${order.vendor.toLowerCase().replace(/\s+/g, '').replace('#', '')}.com`,
                  subject: `${order.shipment_id} - Shipment Notification`,
                  preview: `Order confirmed: ${order.expected_qty} units of ${order.expected_sku}`,
                  timestamp: new Date().toISOString(),
                  hasAttachment: true,
                  unread: true,
                },
              ];
            } else {
              newData.emails = generateDemoEmails();
            }
          }
        } else if (sourceType === 'onedrive') {
          newData.files = generateDemoFiles();
        }

        setSourceData((prev) => ({ ...prev, [sourceName]: newData }));
        setSourceStatuses((prev) => ({ ...prev, [sourceName]: 'complete' }));
      } catch (error) {
        debug.criticalError('Source data fetch failed', error);
        setSourceStatuses((prev) => ({ ...prev, [sourceName]: 'complete' }));
      }
    }, 2500 + Math.random() * 1000);
  }, [selectedUseCase, sessionCode]);

  // Build participation data for PDF credits page
  const buildParticipationData = useCallback(async (): Promise<SessionParticipation> => {
    const participation: SessionParticipation = {
      sessionCode,
    };

    try {
      // Fetch challenge winners from billing_challenge_responses
      const { data: challengeData } = await supabase
        .from('billing_challenge_responses')
        .select('participant_name, time_taken_ms, is_correct, challenge_type')
        .eq('session_code', sessionCode)
        .eq('is_correct', true)
        .order('time_taken_ms', { ascending: true })
        .limit(3);

      if (challengeData && challengeData.length > 0) {
        participation.challengeWinners = challengeData.map(entry => ({
          name: entry.participant_name,
          challenge: entry.challenge_type === 'billing' ? 'Billing Challenge' : 'Reconciliation Quiz',
          time: entry.time_taken_ms / 1000, // Convert to seconds
        }));
      }

      // Fetch scan contributors from barcode_scans
      const { data: scanData } = await supabase
        .from('barcode_scans')
        .select('scanned_by, qty_scanned')
        .eq('session_code', sessionCode);

      if (scanData && scanData.length > 0) {
        // Aggregate by scanner name
        const scannerTotals = scanData.reduce((acc, scan) => {
          const name = scan.scanned_by || 'Anonymous';
          acc[name] = (acc[name] || 0) + (scan.qty_scanned || 1);
          return acc;
        }, {} as Record<string, number>);

        participation.scanContributors = Object.entries(scannerTotals)
          .map(([name, units]) => ({ name, unitsScanned: units }))
          .sort((a, b) => b.unitsScanned - a.unitsScanned)
          .slice(0, 5); // Top 5 contributors
      }

      // Calculate value generated based on discrepancies caught
      if (discrepancies.length > 0) {
        // Estimate $50 per unit discrepancy caught (reasonable for shipping errors)
        const totalUnits = discrepancies.reduce((sum, d) => {
          const match = d.details.match(/(\d+)/);
          return sum + (match ? parseInt(match[1]) : 10);
        }, 0);
        participation.errorsPreventedValue = totalUnits * 50;

        // Estimate 5 minutes saved per discrepancy vs manual checking
        participation.timeSavedMinutes = discrepancies.length * 5 + 15; // Plus 15 for report generation
      }

      // Count total participants
      const uniqueParticipants = new Set([
        ...(challengeData?.map(c => c.participant_name) || []),
        ...(scanData?.map(s => s.scanned_by).filter(Boolean) || []),
      ]);
      participation.totalParticipants = uniqueParticipants.size;

    } catch (error) {
      debug.log('Error fetching participation data:', error);
    }

    return participation;
  }, [sessionCode, discrepancies]);

  // Handle processing - REAL reconciliation
  const handleProcess = useCallback(async () => {
    if (!selectedUseCase || !sessionCode) return;

    setProcessingStatus('processing');
    setProcessingProgress(0);
    setFocusedNodeId('processing');

    // Simulate processing with progress updates
    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      // Shipping reconciliation
      if (selectedUseCase.id === 'shipping') {
        // Fetch actual data from Supabase
        const [expectedRes, scannedRes, receivedRes] = await Promise.all([
          supabase.from('shipments_expected').select('*').eq('session_code', sessionCode),
          supabase.from('barcode_scans').select('*').eq('session_code', sessionCode),
          supabase.from('shipments_received').select('*').eq('session_code', sessionCode),
        ]);

        // Run real reconciliation
        const result = reconcileShipments(
          expectedRes.data || [],
          scannedRes.data || [],
          receivedRes.data || []
        );

        // Complete after delay with REAL stats
        setTimeout(async () => {
          clearInterval(interval);
          setProcessingProgress(100);

          const stats = {
            processed: result.totalProcessed,
            flagged: result.totalFlagged,
            errors: 0,
          };
          setProcessingStats(stats);
          setDiscrepancies(result.discrepancies);

          // Generate and PERSIST escalations for critical/high severity discrepancies
          const escalationInserts = result.discrepancies
            .filter(d => d.severity === 'critical' || d.severity === 'high')
            .map(d => ({
              session_code: sessionCode,
              source_type: 'discrepancy',
              source_id: d.shipment_id,
              severity: d.severity,
              routed_to: d.severity === 'critical' ? 'Operations Manager' : 'Warehouse Supervisor',
              status: 'pending',
            }));

          if (escalationInserts.length > 0) {
            await supabase.from('escalations').insert(escalationInserts);
          }

          // Update local state (will also be populated from Supabase query)
          const newEscalations = escalationInserts.map((e, i) => ({
            id: `esc-${Date.now()}-${i}`,
            ...e,
          }));
          setEscalations(newEscalations);

          // Generate communications for notifications with Gemini
          const newCommunications = [];

          // Generate detailed escalation emails for critical/high severity items
          const escalationEmailPromises = result.discrepancies
            .filter(d => d.severity === 'critical' || d.severity === 'high')
            .map(async (d) => {
              try {
                const email = await generateEscalationEmail(d);
                return {
                  id: `comm-esc-${d.id}`,
                  comm_type: 'email',
                  recipient: d.severity === 'critical' ? 'Operations Manager' : 'Warehouse Supervisor',
                  subject: email.subject,
                  body: email.body,
                  sent_at: new Date().toISOString(),
                };
              } catch (error) {
                debug.error('Error generating escalation email:', error);
                return {
                  id: `comm-esc-${d.id}`,
                  comm_type: 'email',
                  recipient: d.severity === 'critical' ? 'Operations Manager' : 'Warehouse Supervisor',
                  subject: `URGENT: ${d.type.replace(/_/g, ' ')} on ${d.shipment_id}`,
                  body: `Discrepancy detected: ${d.details}\n\nRecommended Action: ${d.recommendedAction}`,
                  sent_at: new Date().toISOString(),
                };
              }
            });

          const escalationEmails = await Promise.all(escalationEmailPromises);
          newCommunications.push(...escalationEmails);

          // Summary alert if there are flagged items
          if (result.totalFlagged > 0) {
            newCommunications.push({
              id: 'comm-summary',
              comm_type: 'alert',
              recipient: 'Operations Team',
              subject: `Reconciliation complete: ${result.totalFlagged} items need review`,
              body: `Processing completed with ${result.totalProcessed} shipments. ${result.totalFlagged} discrepancies flagged for human review.`,
              sent_at: new Date().toISOString(),
            });
          }

          // Persist communications to Supabase
          if (newCommunications.length > 0) {
            const commsToInsert = newCommunications.map(c => ({
              session_code: sessionCode,
              comm_type: c.comm_type,
              recipient: c.recipient,
              subject: c.subject,
              body: c.body || null,
            }));

            await supabase.from('communications_log').insert(commsToInsert);
          }

          setCommunications(newCommunications);

          // Generate reconciliation report with Gemini
          try {
            const report = await generateReconciliationReport(result);
            setReconciliationReport(report);
          } catch (error) {
            debug.error('Error generating report:', error);
          }

          setProcessingStatus('complete');
          setFocusedNodeId('output');

          // Mark outputs as ready
          setOutputFiles((prev) => prev.map((f) => ({ ...f, ready: true })));

          onProcessComplete?.(stats);
        }, 3000);
      } else if (selectedUseCase.id === 'quality') {
        // Quality/Compliance reconciliation
        const [receivingRes, coaRes, issuesRes] = await Promise.all([
          supabase.from('quality_receiving_log').select('*').eq('session_code', sessionCode),
          supabase.from('quality_coa_records').select('*').eq('session_code', sessionCode),
          supabase.from('quality_issues').select('*').eq('session_code', sessionCode),
        ]);

        // Run quality reconciliation
        const result = reconcileQuality(
          receivingRes.data || [],
          coaRes.data || [],
          issuesRes.data || []
        );

        // Complete after delay with REAL stats
        setTimeout(async () => {
          clearInterval(interval);
          setProcessingProgress(100);

          const stats = {
            processed: result.totalProcessed,
            flagged: result.totalFlagged,
            errors: 0,
          };
          setProcessingStats(stats);
          setDiscrepancies(result.discrepancies);

          // Generate escalations for critical quality issues
          const escalationInserts = result.discrepancies
            .filter(d => d.severity === 'critical' || d.severity === 'high')
            .map(d => ({
              session_code: sessionCode,
              source_type: 'quality_issue',
              source_id: d.shipment_id,
              severity: d.severity,
              routed_to: d.severity === 'critical' ? 'Quality Manager' : 'Receiving Supervisor',
              status: 'pending',
            }));

          if (escalationInserts.length > 0) {
            await supabase.from('escalations').insert(escalationInserts);
          }

          const newEscalations = escalationInserts.map((e, i) => ({
            id: `esc-${Date.now()}-${i}`,
            ...e,
          }));
          setEscalations(newEscalations);

          // Generate communications for quality alerts
          const newCommunications = [];

          // Quality escalation emails
          for (const d of result.discrepancies.filter(d => d.severity === 'critical' || d.severity === 'high')) {
            newCommunications.push({
              id: `comm-quality-${d.id}`,
              comm_type: 'email',
              recipient: d.severity === 'critical' ? 'Quality Manager' : 'Receiving Supervisor',
              subject: `${d.severity === 'critical' ? 'CRITICAL' : 'ALERT'}: Quality Issue - ${d.shipment_id}`,
              body: `${d.details}\n\nRecommended Action: ${d.recommendedAction}`,
              sent_at: new Date().toISOString(),
            });
          }

          // Summary alert
          if (result.totalFlagged > 0) {
            newCommunications.push({
              id: 'comm-quality-summary',
              comm_type: 'alert',
              recipient: 'Quality Team',
              subject: `Quality Review Complete: ${result.totalFlagged} issues found`,
              body: `Processed ${result.totalProcessed} receiving entries. ${result.totalFlagged} compliance issues flagged for review.`,
              sent_at: new Date().toISOString(),
            });
          }

          if (newCommunications.length > 0) {
            const commsToInsert = newCommunications.map(c => ({
              session_code: sessionCode,
              comm_type: c.comm_type,
              recipient: c.recipient,
              subject: c.subject,
              body: c.body || null,
            }));
            await supabase.from('communications_log').insert(commsToInsert);
          }

          setCommunications(newCommunications);
          setProcessingStatus('complete');
          setFocusedNodeId('output');
          setOutputFiles((prev) => prev.map((f) => ({ ...f, ready: true })));
          onProcessComplete?.(stats);
        }, 3000);
      } else if (selectedUseCase.id === 'customer-orders') {
        // Customer Order reconciliation
        const [ordersRes, linesRes, priceRes, inventoryRes, issuesRes] = await Promise.all([
          supabase.from('customer_orders').select('*').eq('session_code', sessionCode),
          supabase.from('customer_order_lines').select('*').eq('session_code', sessionCode),
          supabase.from('product_price_list').select('*').eq('session_code', sessionCode),
          supabase.from('product_inventory').select('*').eq('session_code', sessionCode),
          supabase.from('customer_order_issues').select('*').eq('session_code', sessionCode),
        ]);

        // Run customer order reconciliation
        const result = reconcileCustomerOrders(
          ordersRes.data || [],
          linesRes.data || [],
          priceRes.data || [],
          inventoryRes.data || [],
          issuesRes.data || []
        );

        // Complete after delay with REAL stats
        setTimeout(async () => {
          clearInterval(interval);
          setProcessingProgress(100);

          const stats = {
            processed: result.totalProcessed,
            flagged: result.totalFlagged,
            errors: 0,
          };
          setProcessingStats(stats);
          setDiscrepancies(result.discrepancies);

          // Generate escalations for high severity order issues
          const escalationInserts = result.discrepancies
            .filter(d => d.severity === 'high')
            .map(d => ({
              session_code: sessionCode,
              source_type: 'order_issue',
              source_id: d.shipment_id,
              severity: d.severity,
              routed_to: 'Sales Manager',
              status: 'pending',
            }));

          if (escalationInserts.length > 0) {
            await supabase.from('escalations').insert(escalationInserts);
          }

          const newEscalations = escalationInserts.map((e, i) => ({
            id: `esc-${Date.now()}-${i}`,
            ...e,
          }));
          setEscalations(newEscalations);

          // Generate communications
          const newCommunications = [];

          // Order issue alerts
          for (const d of result.discrepancies.filter(d => d.severity === 'high')) {
            newCommunications.push({
              id: `comm-order-${d.id}`,
              comm_type: 'email',
              recipient: 'Sales Manager',
              subject: `ORDER ALERT: ${d.shipment_id} - ${d.type.replace(/_/g, ' ')}`,
              body: `${d.details}\n\nRecommended Action: ${d.recommendedAction}`,
              sent_at: new Date().toISOString(),
            });
          }

          // Summary
          if (result.totalProcessed > 0) {
            newCommunications.push({
              id: 'comm-order-summary',
              comm_type: 'alert',
              recipient: 'Sales Team',
              subject: `Order Processing Complete: ${result.totalProcessed} orders, ${result.totalFlagged} issues`,
              body: `Processed ${result.totalProcessed} customer orders. ${result.clean.length} ready for fulfillment, ${result.totalFlagged} need attention.`,
              sent_at: new Date().toISOString(),
            });
          }

          if (newCommunications.length > 0) {
            const commsToInsert = newCommunications.map(c => ({
              session_code: sessionCode,
              comm_type: c.comm_type,
              recipient: c.recipient,
              subject: c.subject,
              body: c.body || null,
            }));
            await supabase.from('communications_log').insert(commsToInsert);
          }

          setCommunications(newCommunications);
          setProcessingStatus('complete');
          setFocusedNodeId('output');
          setOutputFiles((prev) => prev.map((f) => ({ ...f, ready: true })));
          onProcessComplete?.(stats);
        }, 3000);
      } else {
        // For other use cases, use placeholder logic for now
        setTimeout(() => {
          clearInterval(interval);
          setProcessingProgress(100);

          const stats = {
            processed: Math.floor(Math.random() * 20) + 10,
            flagged: Math.floor(Math.random() * 5),
            errors: 0,
          };
          setProcessingStats(stats);
          setProcessingStatus('complete');
          setFocusedNodeId('output');
          setOutputFiles((prev) => prev.map((f) => ({ ...f, ready: true })));
          onProcessComplete?.(stats);
        }, 3000);
      }
    } catch (error) {
      debug.criticalError('Processing failed', error);
      clearInterval(interval);
      setProcessingStatus('idle');
    }
  }, [selectedUseCase, sessionCode, onProcessComplete]);

  // Trigger presentation mode - open first slide
  useEffect(() => {
    if (startPresentationMode && selectedUseCase && selectedUseCase.sources.length > 0) {
      const firstSource = selectedUseCase.sources[0];
      const firstNodeId = `source-${firstSource.name}`;
      handleShowInfo(
        firstSource.type,
        firstNodeId,
        firstSource.name,
        0,
        () => handleSourceActivate(firstSource.name, firstSource.type),
        sourceStatuses[firstSource.name]
      );
      onPresentationStart?.();
    }
  }, [startPresentationMode, selectedUseCase, handleShowInfo, handleSourceActivate, sourceStatuses, onPresentationStart]);

  // Build complete navigation order (all nodes, not just sources)
  const getNavigationOrder = useCallback(() => {
    if (!selectedUseCase) return [];

    const navOrder: Array<{id: string; type: string; label: string; index: number}> = [];

    // Add source nodes
    selectedUseCase.sources.forEach((source, idx) => {
      navOrder.push({
        id: `source-${source.name}`,
        type: source.type,
        label: source.name,
        index: idx,
      });
    });

    // Add pipeline nodes in order
    navOrder.push(
      { id: 'etl', type: 'etl', label: 'ETL/Normalization', index: -1 },
      { id: 'intake', type: 'intake', label: 'Intake Folder', index: -1 },
      { id: 'processing', type: 'processing', label: 'Data Engine', index: -1 },
      { id: 'review-queue', type: 'reviewQueue', label: 'Review Queue', index: -1 },
      { id: 'escalation', type: 'escalation', label: 'Escalation Router', index: -1 },
      { id: 'communications', type: 'communications', label: 'Communications', index: -1 },
      { id: 'output', type: 'output', label: 'Reports', index: -1 }
    );

    // Add "Up Next" transition slide at the end
    const nextUseCase = getNextUseCase(selectedUseCase.id);
    navOrder.push({
      id: 'upNext',
      type: 'upNext',
      label: nextUseCase ? `Up Next: ${nextUseCase.name}` : 'Questions & Discussion',
      index: -1,
    });

    return navOrder;
  }, [selectedUseCase]);

  // Navigate to next/previous slide (through ALL nodes)
  const handleNextSlide = useCallback(() => {
    if (!infoNodeId) return;

    const navOrder = getNavigationOrder();
    const currentIdx = navOrder.findIndex(n => n.id === infoNodeId);

    if (currentIdx >= 0 && currentIdx < navOrder.length - 1) {
      const next = navOrder[currentIdx + 1];
      handleShowInfo(next.type, next.id, next.label, next.index, undefined, undefined);

      // Preload images for upcoming slides (2 ahead)
      if (selectedUseCase) {
        for (let i = 2; i <= 3; i++) {
          const futureIdx = currentIdx + i;
          if (futureIdx < navOrder.length) {
            const futureNode = navOrder[futureIdx];
            const imageUrl = getNodeImage(selectedUseCase.id, futureNode.type, futureNode.label);
            if (imageUrl) {
              preloadImage(imageUrl);
            }
          }
        }
      }
    }
  }, [infoNodeId, getNavigationOrder, handleShowInfo, selectedUseCase]);

  const handlePreviousSlide = useCallback(() => {
    if (!infoNodeId) return;

    const navOrder = getNavigationOrder();
    const currentIdx = navOrder.findIndex(n => n.id === infoNodeId);

    if (currentIdx > 0) {
      const prev = navOrder[currentIdx - 1];
      handleShowInfo(prev.type, prev.id, prev.label, prev.index, undefined, undefined);

      // Preload images for previous slides (2 behind)
      if (selectedUseCase) {
        for (let i = 2; i <= 3; i++) {
          const pastIdx = currentIdx - i;
          if (pastIdx >= 0) {
            const pastNode = navOrder[pastIdx];
            const imageUrl = getNodeImage(selectedUseCase.id, pastNode.type, pastNode.label);
            if (imageUrl) {
              preloadImage(imageUrl);
            }
          }
        }
      }
    }
  }, [infoNodeId, getNavigationOrder, handleShowInfo, selectedUseCase]);

  // Check if can process
  const canProcess = selectedUseCase
    ? selectedUseCase.sources
        .filter((s) => !s.optional)
        .every((s) => sourceStatuses[s.name] === 'complete')
    : false;

  // Trigger ETL when all sources are complete
  useEffect(() => {
    if (canProcess && etlStatus === 'idle') {
      setEtlStatus('processing');

      // Simulate ETL processing
      setTimeout(() => {
        // Generate mock transformations
        const mockTransformations = [
          { field: 'weight', original: '1000 lbs', transformed: '453.6 kg', type: 'unit_conversion' },
          { field: 'ship_date', original: '1/15/25', transformed: '2025-01-15', type: 'date_format' },
          { field: 'vendor_sku', original: 'VNP-1247', transformed: 'CTN-12OZ', type: 'sku_mapping' },
          { field: 'employee_name', original: 'JOHN DOE', transformed: 'John Doe', type: 'name_normalization' },
          { field: 'location', original: 'Zone 3, Row 12', transformed: 'Z3-R12', type: 'location_parsing' },
        ];
        setTransformations(mockTransformations);
        setEtlStatus('complete');
      }, 1500);
    }
  }, [canProcess, etlStatus]);

  // Helper to show toast with context-aware types and optional duration
  const showToast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    // Default duration: 6 seconds for regular, 8 seconds for celebrations
    const defaultDuration = type === 'challenge-completed' ? 8000 : 6000;
    setToasts(prev => [...prev, { id, type, message, duration: duration || defaultDuration }]);
  }, []);

  const closeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Subscribe to realtime events for notifications AND live preview updates
  useEffect(() => {
    if (!sessionCode) return;

    const channel = supabase
      .channel(`session-${sessionCode}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'barcode_scans',
          filter: `session_code=eq.${sessionCode}`,
        },
        (payload) => {
          debug.log('New barcode scan detected:', payload.new);
          const scan = payload.new as {shipment_id: string; sku: string; qty_scanned: number; scanned_at: string; scanned_by: string};
          setLiveScans(prev => [scan, ...prev]);

          // Show notification with context-aware type
          showToast('scan-completed', `${scan.scanned_by} scanned ${scan.shipment_id} (${scan.qty_scanned} units)`);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'communications_log',
          filter: `session_code=eq.${sessionCode}`,
        },
        (payload) => {
          const comm = payload.new as {subject: string; recipient: string};
          if (comm.subject.includes('joined') || comm.subject.includes('signed')) {
            showToast('user-joined', comm.subject);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shipments_received',
          filter: `session_code=eq.${sessionCode}`,
        },
        (payload) => {
          const receipt = payload.new as {shipment_id: string; receiver_name: string};
          showToast('receipt-signed', `${receipt.receiver_name} signed receipt for ${receipt.shipment_id}`);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shipments_expected',
          filter: `session_code=eq.${sessionCode}`,
        },
        (payload) => {
          const shipment = payload.new as {
            ship_date: string;
            shipment_id: string;
            vendor: string;
            destination: string;
            expected_qty: number;
            expected_sku: string;
            notes: string | null;
          };
          showToast('data-submitted', `New shipment added: ${shipment.shipment_id} (${shipment.expected_qty} units from ${shipment.vendor})`);

          // Update live preview spreadsheet data
          setSourceData(prev => {
            const existing = prev['Expected Shipments'];
            if (existing?.spreadsheet) {
              const newRow = [
                shipment.ship_date,
                shipment.shipment_id,
                shipment.vendor,
                shipment.destination,
                shipment.expected_qty,
                shipment.expected_sku,
                shipment.notes || '',
              ];
              return {
                ...prev,
                'Expected Shipments': {
                  ...existing,
                  spreadsheet: {
                    ...existing.spreadsheet,
                    rows: [...existing.spreadsheet.rows, newRow],
                  },
                },
              };
            }
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'training_roster',
          filter: `session_code=eq.${sessionCode}`,
        },
        (payload) => {
          const training = payload.new as {
            employee_id: string;
            employee_name: string;
            department: string;
            training_type?: string;
            scheduled_date?: string;
          };
          showToast('data-submitted', `Training scheduled: ${training.employee_name} - ${training.training_type || 'Safety & SOP'}`);

          // Update live preview spreadsheet data
          setSourceData(prev => {
            const existing = prev['Training Roster'];
            if (existing?.spreadsheet) {
              const newRow = [
                training.employee_id,
                training.employee_name,
                training.department,
                '', // supervisor - may not be in payload
                '', // hire_date - may not be in payload
              ];
              return {
                ...prev,
                'Training Roster': {
                  ...existing,
                  spreadsheet: {
                    ...existing.spreadsheet,
                    rows: [...existing.spreadsheet.rows, newRow],
                  },
                },
              };
            }
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'incidents',
          filter: `session_code=eq.${sessionCode}`,
        },
        (payload) => {
          const incident = payload.new as Incident;
          showToast('incident-submitted', `${incident.reported_by} reported ${incident.incident_type} incident (Severity ${incident.severity})`);
          // Add to incidents state for live display
          setIncidents(prev => [incident, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'review_decisions',
          filter: `session_code=eq.${sessionCode}`,
        },
        (payload) => {
          const decision = payload.new as {
            id: string;
            item_type: string;
            decision: string;
            decided_by: string;
            comment: string | null;
            created_at: string;
          };
          showToast('success', `${decision.decided_by} ${decision.decision === 'accept' ? 'approved' : 'rejected'} a ${decision.item_type} item`);
          // Add to review decisions state for live display
          setReviewDecisions(prev => [decision, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_participants',
          filter: `session_code=eq.${sessionCode}`,
        },
        (payload) => {
          const participant = payload.new as {
            participant_name: string;
            node_name: string | null;
          };
          // Context-aware message based on where they joined
          const nodeName = participant.node_name?.toLowerCase() || '';
          if (nodeName.includes('challenge') || nodeName.includes('invoice') || nodeName.includes('reconciliation') || nodeName.includes('billing')) {
            showToast('challenge-joined', `${participant.participant_name} joined the challenge!`);
          } else if (nodeName.includes('incident') || nodeName.includes('report')) {
            showToast('user-joined', `${participant.participant_name} joined to report incidents`);
          } else if (nodeName.includes('scan') || nodeName.includes('barcode')) {
            showToast('user-joined', `${participant.participant_name} joined to scan barcodes`);
          } else if (nodeName) {
            showToast('user-joined', `${participant.participant_name} joined: ${participant.node_name}`);
          } else {
            showToast('user-joined', `${participant.participant_name} joined the session!`);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'billing_challenge_responses',
          filter: `session_code=eq.${sessionCode}`,
        },
        (payload) => {
          const response = payload.new as {
            participant_name: string;
            is_correct: boolean;
            time_taken_seconds: number;
          };
          // Show celebration for challenge completion
          if (response.is_correct) {
            showToast('challenge-completed', `${response.participant_name} completed the challenge in ${response.time_taken_seconds}s!`);
          } else {
            showToast('success', `${response.participant_name} submitted their answer`);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionCode, showToast]);

  // Auto-simulation effect
  useEffect(() => {
    if (!isSimulating || !selectedUseCase) return;

    const pendingSources = selectedUseCase.sources.filter(
      s => sourceStatuses[s.name] === 'pending'
    );

    if (pendingSources.length > 0) {
      // Simulate staggered data arrival
      const randomSource = pendingSources[Math.floor(Math.random() * pendingSources.length)];
      simulationRef.current = setTimeout(() => {
        handleSourceActivate(randomSource.name, randomSource.type);
      }, 2000 + Math.random() * 3000);
    } else if (canProcess && processingStatus === 'idle') {
      // All sources complete, start processing
      simulationRef.current = setTimeout(() => {
        handleProcess();
      }, 1500);
    }

    return () => {
      if (simulationRef.current) clearTimeout(simulationRef.current);
    };
  }, [isSimulating, selectedUseCase, sourceStatuses, canProcess, processingStatus, handleProcess, handleSourceActivate]);

  // Handle node click for focus mode
  // Use case selector is excluded from focus mode - it's a control node, not a data node
  const handleNodeClick = useCallback((nodeId: string) => {
    if (nodeId === 'use-case-selector') return; // Don't focus the selector
    setFocusedNodeId((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  // Clear focus when clicking canvas background
  const handlePaneClick = useCallback(() => {
    setFocusedNodeId(null);
  }, []);

  // Build nodes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildNodes = useCallback((): Node[] => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodes: Node[] = [];
    const xSpacing = 360; // Increased horizontal spacing

    // Helper to get position with override
    const getPosition = (nodeId: string, defaultPos: { x: number; y: number }) => {
      return nodePositionOverrides[nodeId] || defaultPos;
    };

    // Use case selector node (always first, positioned to the left and higher up)
    // This is a control node - it doesn't participate in focus mode
    nodes.push({
      id: 'use-case-selector',
      type: 'useCaseSelector',
      position: getPosition('use-case-selector', { x: -120, y: 80 }),
      data: {
        useCases,
        selectedUseCase,
        onSelect: handleUseCaseSelect,
        onSelectTheory: handleSelectTheory,
        isTheoryMode,
      },
      // No className - selector never gets focused or unfocused styling
    });

    // Only show rest of flow if use case is selected
    if (selectedUseCase) {
      const ySpacing = 150; // Increased spacing for better presentation
      // Add slight stagger for visual interest
      const staggerOffsets = [0, 15, -10, 20, -15];

      // Source nodes
      selectedUseCase.sources.forEach((source, index) => {
        const yOffset = (index - (selectedUseCase.sources.length - 1) / 2) * ySpacing;
        const stagger = staggerOffsets[index % staggerOffsets.length];
        const data = sourceData[source.name] || {};
        const nodeId = `source-${source.name}`;
        const isFocused = focusedNodeId === nodeId;
        const isUnfocused = focusedNodeId && !isFocused;

        // Check if this node is active in presentation mode
        const isPresentationActive = presentationActiveNode === nodeId;

        // Generate QR code URL for paper sources
        const qrCodeUrl = source.type === 'paper'
          ? `${window.location.origin}/upload/${sessionCode}/${encodeURIComponent(source.name)}`
          : undefined;

        nodes.push({
          id: nodeId,
          type: 'source',
          position: getPosition(nodeId, { x: xSpacing + stagger, y: 180 + yOffset }),
          data: {
            label: source.name,
            type: source.type,
            status: sourceStatuses[source.name],
            optional: source.optional,
            onActivate: () => handleSourceActivate(source.name, source.type),
            onExpand: () => handleExpandNode(source.name, source.type),
            onShowInfo: () => handleShowInfo(
              source.type,
              nodeId,
              source.name,
              index, // Pass the source index
              () => handleSourceActivate(source.name, source.type),
              sourceStatuses[source.name]
            ),
            isFocused,
            emails: data.emails,
            files: data.files,
            spreadsheet: data.spreadsheet,
            capturedImage: data.capturedImage,
            qrCodeUrl,
            sessionCode, // For barcode scanner QR generation
          },
          className: isUnfocused ? 'node-unfocused' : isFocused ? 'node-focused' : isPresentationActive ? 'node-presentation-active' : '',
        });
      });

      // ETL/Normalization node (NEW - between sources and intake)
      const etlIsFocused = focusedNodeId === 'etl';
      const etlIsUnfocused = focusedNodeId && !etlIsFocused;
      const etlIsPresentationActive = presentationActiveNode === 'etl';
      nodes.push({
        id: 'etl',
        type: 'etl',
        position: getPosition('etl', { x: xSpacing * 2 - 40, y: 180 }),
        data: {
          label: 'ETL/Normalization',
          status: etlStatus,
          transformations: etlStatus === 'complete' ? transformations : undefined,
          onShowInfo: () => handleShowInfo('etl', 'etl', 'ETL/Normalization', -1, undefined, undefined),
        },
        className: etlIsUnfocused ? 'node-unfocused' : etlIsFocused ? 'node-focused' : etlIsPresentationActive ? 'node-presentation-active' : '',
      });

      // Intake node
      const intakeIsFocused = focusedNodeId === 'intake';
      const intakeIsUnfocused = focusedNodeId && !intakeIsFocused;
      const intakeIsPresentationActive = presentationActiveNode === 'intake';
      nodes.push({
        id: 'intake',
        type: 'intake',
        position: getPosition('intake', { x: xSpacing * 3 - 40, y: 140 }),
        data: {
          label: 'Intake Folder',
          items: buildIntakeItems(),
          canProcess,
          onProcess: handleProcess,
          onShowInfo: () => handleShowInfo('intake', 'intake', 'Intake Folder', -1, undefined, undefined),
        },
        className: intakeIsUnfocused ? 'node-unfocused' : intakeIsFocused ? 'node-focused' : intakeIsPresentationActive ? 'node-presentation-active' : '',
      });

      // Processing node - build source statuses for status messages
      const processingSourceStatuses = selectedUseCase.sources.map(s => ({
        name: s.name,
        received: sourceStatuses[s.name] === 'complete',
      }));

      const processingIsFocused = focusedNodeId === 'processing';
      const processingIsUnfocused = focusedNodeId && !processingIsFocused;
      const processingIsPresentationActive = presentationActiveNode === 'processing';
      nodes.push({
        id: 'processing',
        type: 'processing',
        position: getPosition('processing', { x: xSpacing * 4, y: 160 }),
        data: {
          label: 'Data Engine',
          status: processingStatus,
          progress: processingProgress,
          stats: processingStatus === 'complete' ? processingStats : undefined,
          sources: processingSourceStatuses,
          discrepancies: processingStatus === 'complete' ? discrepancies : undefined,
          onShowInfo: () => handleShowInfo('processing', 'processing', 'Data Engine', -1, undefined, undefined),
          onViewDiscrepancies: () => setShowDiscrepancyList(true),
        },
        className: processingIsUnfocused ? 'node-unfocused' : processingIsFocused ? 'node-focused' : processingIsPresentationActive ? 'node-presentation-active' : '',
      });

      // Review Queue node (NEW - branch from processing)
      // Use incidents data when in incidents use case, otherwise use discrepancies
      const reviewQueueItems = selectedUseCase?.id === 'incidents'
        ? incidents
            .filter(i => i.severity <= 3 || (i.ai_confidence && i.ai_confidence < 75))
            .slice(0, 5)
            .map(i => ({
              id: i.id,
              type: i.incident_type,
              severity: i.severity <= 2 ? 'low' : i.severity === 3 ? 'medium' : 'high',
              summary: `${i.location}: ${i.incident_type}`,
              confidence: i.ai_confidence || 80,
            }))
        : discrepancies.slice(0, 5).map(d => ({
            id: d.id,
            type: d.type,
            severity: d.severity,
            summary: `${d.shipment_id}: ${d.details}`,
            confidence: d.confidence,
          }));

      nodes.push({
        id: 'review-queue',
        type: 'reviewQueue',
        position: getPosition('review-queue', { x: xSpacing * 5, y: 60 }),
        data: {
          label: 'Review Queue',
          incidents: reviewQueueItems,
          onViewQueue: () => setShowDiscrepancyList(true),
          onShowInfo: () => handleShowInfo('reviewQueue', 'review-queue', 'Review Queue', -1, undefined, undefined),
        },
        className: presentationActiveNode === 'review-queue' ? 'node-presentation-active' : '',
      });

      // Escalation node (NEW - branch from processing)
      // Use incidents data when in incidents use case, otherwise use discrepancies
      const criticalEscalations = selectedUseCase?.id === 'incidents'
        ? incidents
            .filter(i => i.severity >= 4)
            .map(i => ({
              id: i.id,
              source_type: 'incident',
              source_id: i.incident_type,
              severity: i.severity >= 5 ? 'critical' : 'high',
              routed_to: i.severity >= 5 ? 'Safety Team' : 'Maintenance Lead',
              status: i.status || 'pending',
            }))
        : discrepancies
            .filter(d => d.severity === 'critical' || d.severity === 'high')
            .map(d => ({
              id: d.id,
              source_type: 'discrepancy',
              source_id: d.shipment_id,
              severity: d.severity,
              routed_to: d.severity === 'critical' ? 'Operations Manager' : 'Warehouse Supervisor',
              status: 'pending',
            }));

      nodes.push({
        id: 'escalation',
        type: 'escalation',
        position: getPosition('escalation', { x: xSpacing * 5, y: 260 }),
        data: {
          label: 'Escalation Router',
          items: criticalEscalations,
          onViewEscalations: () => debug.log('View escalations'),
          onShowInfo: () => handleShowInfo('escalation', 'escalation', 'Escalation Router', -1, undefined, undefined),
        },
        className: presentationActiveNode === 'escalation' ? 'node-presentation-active' : '',
      });

      // Communications node (NEW - parallel to output)
      nodes.push({
        id: 'communications',
        type: 'communications',
        position: getPosition('communications', { x: xSpacing * 5, y: 400 }),
        data: {
          label: 'Communications',
          communications: communications,
          onEmailClick: (email: typeof communications[0]) => setSelectedEmail(email),
          onViewCommunications: () => {
            if (communications.length > 0) {
              setSelectedEmail(communications[0]);
            }
          },
          onShowInfo: () => handleShowInfo('communications', 'communications', 'Communications', -1, undefined, undefined),
        },
        className: presentationActiveNode === 'communications' ? 'node-presentation-active' : '',
      });

      // Output node (repositioned)
      const outputIsFocused = focusedNodeId === 'output';
      const outputIsUnfocused = focusedNodeId && !outputIsFocused;
      const outputIsPresentationActive = presentationActiveNode === 'output';
      nodes.push({
        id: 'output',
        type: 'output',
        position: getPosition('output', { x: xSpacing * 6 - 40, y: 140 }),
        data: {
          label: 'Reports',
          files: outputFiles,
          onPreview: (file: OutputFile) => {
            if (file.id === 'reconciliation-report' && reconciliationReport) {
              setShowReportModal(true);
            } else if (file.id === 'incident-summary' || file.id === 'incident-report') {
              // Generate incident report from current incidents data
              const now = new Date();
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              const reportData: IncidentReportData = {
                reportPeriod: `${weekAgo.toLocaleDateString()} - ${now.toLocaleDateString()}`,
                generatedAt: now.toLocaleString(),
                incidents: incidents.map(inc => ({
                  id: inc.id || `inc-${Math.random().toString(36).substr(2, 9)}`,
                  incident_type: inc.incident_type || 'Unknown',
                  severity: inc.severity || 3,
                  location: inc.location || 'Unknown location',
                  description: inc.description || 'No description provided',
                  reported_by: inc.reported_by || 'Anonymous',
                  reported_at: inc.reported_at || new Date().toISOString(),
                  status: inc.status || 'Open',
                  photo_url: inc.photo_url,
                  ai_confidence: inc.ai_confidence,
                  routed_to: inc.status === 'Escalated' ? 'Safety Team' : undefined,
                })),
                statistics: {
                  total: incidents.length,
                  critical: incidents.filter(i => (i.severity || 0) >= 4).length,
                  moderate: incidents.filter(i => (i.severity || 0) === 3).length,
                  minor: incidents.filter(i => (i.severity || 0) <= 2).length,
                  resolved: incidents.filter(i => i.status === 'Resolved').length,
                  pending: incidents.filter(i => i.status !== 'Resolved').length,
                },
                trends: incidents.length > 0 ? {
                  direction: 'stable',
                  percentChange: 0,
                  comparedTo: 'previous week',
                } : undefined,
              };
              setIncidentReport(reportData);
              setShowIncidentReportModal(true);
            }
          },
          onDownload: async (file: OutputFile) => {
            debug.log('Download:', file);

            // Generate PDF files with participation data
            if (file.type === 'pdf' && reconciliationReport) {
              // Fetch participation data for credits page
              const participation = await buildParticipationData();
              const pdfBlob = generatePDF(reconciliationReport, participation);
              const filename = `${file.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
              downloadBlob(pdfBlob, filename);
            }

            // Generate CSV files
            if (file.type === 'csv' && reconciliationReport) {
              const csvBlob = file.id.includes('discrepancy')
                ? generateDiscrepancyCSV(reconciliationReport)
                : generateFullDataCSV(reconciliationReport);
              const filename = `${file.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
              downloadBlob(csvBlob, filename);
            }
          },
        },
        className: outputIsUnfocused ? 'node-unfocused' : outputIsFocused ? 'node-focused' : outputIsPresentationActive ? 'node-presentation-active' : '',
      });
    }

    // Set zIndex on dragged node to keep it on top
    return nodes.map(node => ({
      ...node,
      zIndex: node.id === draggingNodeId ? 10000 : undefined,
      style: node.id === draggingNodeId ? { zIndex: 10000 } : undefined,
    }));
  }, [
    useCases,
    selectedUseCase,
    sourceStatuses,
    sourceData,
    buildIntakeItems,
    canProcess,
    handleProcess,
    handleSourceActivate,
    handleUseCaseSelect,
    handleExpandNode,
    handleShowInfo,
    processingStatus,
    processingProgress,
    processingStats,
    discrepancies,
    incidents,
    etlStatus,
    transformations,
    escalations,
    communications,
    outputFiles,
    focusedNodeId,
    presentationActiveNode,
    sessionCode,
    nodePositionOverrides,
    draggingNodeId,
  ]);

  // Build edges
  const buildEdges = useCallback((): Edge[] => {
    const edges: Edge[] = [];

    if (!selectedUseCase) return edges;

    // No edges from use case selector - it's a standalone control node
    // This allows users to freely position the flow nodes without being anchored

    // Edges from sources to ETL
    selectedUseCase.sources.forEach((source) => {
      const isComplete = sourceStatuses[source.name] === 'complete';
      const isLoading = sourceStatuses[source.name] === 'loading';

      edges.push({
        id: `edge-${source.name}-etl`,
        source: `source-${source.name}`,
        target: 'etl',
        animated: isLoading,
        style: {
          stroke: isComplete ? '#10b981' : isLoading ? '#2596be' : '#94a3b8',
          strokeWidth: isComplete ? 3 : 2.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isComplete ? '#10b981' : isLoading ? '#2596be' : '#94a3b8',
        },
      });
    });

    // Edge from ETL to intake
    const etlComplete = etlStatus === 'complete';
    edges.push({
      id: 'edge-etl-intake',
      source: 'etl',
      target: 'intake',
      animated: etlStatus === 'processing',
      style: {
        stroke: etlComplete ? '#a855f7' : '#94a3b8',
        strokeWidth: etlComplete ? 3 : 2.5,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: etlComplete ? '#a855f7' : '#94a3b8',
      },
    });

    // Edge from intake to processing
    const isProcessing = processingStatus === 'processing';
    const isComplete = processingStatus === 'complete';

    edges.push({
      id: 'edge-intake-processing',
      source: 'intake',
      target: 'processing',
      animated: isProcessing,
      style: {
        stroke: isComplete ? '#10b981' : isProcessing ? '#8b5cf6' : '#94a3b8',
        strokeWidth: isComplete || isProcessing ? 3 : 2.5,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isComplete ? '#10b981' : isProcessing ? '#8b5cf6' : '#94a3b8',
      },
    });

    // Branching edges from processing (always visible, change color based on state)
    const hasDiscrepancies = discrepancies.length > 0;
    const hasCritical = discrepancies.some(d => d.severity === 'critical' || d.severity === 'high');
    const hasComms = communications.length > 0;

    // To Review Queue (always visible)
    edges.push({
      id: 'edge-processing-review',
      source: 'processing',
      target: 'review-queue',
      animated: isComplete && hasDiscrepancies,
      style: {
        stroke: isComplete && hasDiscrepancies ? '#f59e0b' : '#94a3b8',
        strokeWidth: isComplete && hasDiscrepancies ? 3 : 2.5,
        opacity: isComplete && hasDiscrepancies ? 1 : 0.5,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isComplete && hasDiscrepancies ? '#f59e0b' : '#94a3b8',
      },
    });

    // To Escalation (always visible)
    edges.push({
      id: 'edge-processing-escalation',
      source: 'processing',
      target: 'escalation',
      animated: isComplete && hasCritical,
      style: {
        stroke: isComplete && hasCritical ? '#ef4444' : '#94a3b8',
        strokeWidth: isComplete && hasCritical ? 3 : 2.5,
        strokeDasharray: '5,5',
        opacity: isComplete && hasCritical ? 1 : 0.5,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isComplete && hasCritical ? '#ef4444' : '#94a3b8',
      },
    });

    // To Communications (always visible)
    edges.push({
      id: 'edge-processing-communications',
      source: 'processing',
      target: 'communications',
      animated: isComplete && hasComms,
      style: {
        stroke: isComplete && hasComms ? '#3b82f6' : '#94a3b8',
        strokeWidth: isComplete && hasComms ? 3 : 2.5,
        opacity: isComplete && hasComms ? 1 : 0.5,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isComplete && hasComms ? '#3b82f6' : '#94a3b8',
      },
    });

    // To Output (always visible)
    edges.push({
      id: 'edge-processing-output',
      source: 'processing',
      target: 'output',
      animated: isComplete,
      style: {
        stroke: isComplete ? '#10b981' : '#94a3b8',
        strokeWidth: isComplete ? 3 : 2.5,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isComplete ? '#10b981' : '#94a3b8',
      },
    });

    return edges;
  }, [selectedUseCase, sourceStatuses, etlStatus, processingStatus, discrepancies, communications]);

  // Get source data for expanded modal
  const getExpandedSourceData = () => {
    if (!expandedNode) return {};

    const data = sourceData[expandedNode.id] || {};

    // Provide fallback demo data if source data hasn't been fetched
    if (expandedNode.type === 'excel' && !data.spreadsheet) {
      // Generate appropriate spreadsheet based on source name
      if (expandedNode.label === 'Training Roster') {
        return { ...data, spreadsheet: generateTrainingRoster() };
      } else if (expandedNode.label === 'Acknowledgements') {
        return { ...data, spreadsheet: generateTrainingAcknowledgements() };
      } else {
        return { ...data, spreadsheet: generateDemoSpreadsheet() };
      }
    }

    if (expandedNode.type === 'outlook' && !data.emails) {
      return { ...data, emails: generateDemoEmails() };
    }

    if (expandedNode.type === 'onedrive' && !data.files) {
      return { ...data, files: generateDemoFiles() };
    }

    return data;
  };

  // Check if any positions have been overridden
  const hasPositionOverrides = Object.keys(nodePositionOverrides).length > 0;

  // Build node preview content for info overlay
  const getNodePreviewContent = (): React.ReactNode => {
    if (!infoNodeId || !selectedUseCase) {
      debug.log('No infoNodeId or selectedUseCase');
      return null;
    }

    // Check if it's a pipeline node (not a source)
    if (infoNodeId === 'etl') {
      if (etlStatus === 'complete' && transformations.length > 0) {
        return (
          <div className="space-y-2 p-3">
            <p className="text-xs font-semibold text-purple-700 mb-3">Transformation Log</p>
            {transformations.slice(0, 5).map((t, i) => (
              <div key={i} className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-700">{t.field}:</span>
                  <code className="px-1.5 py-0.5 bg-white rounded text-gray-600">{t.original}</code>
                  <span>→</span>
                  <code className="px-1.5 py-0.5 bg-white rounded text-purple-700 font-semibold">{t.transformed}</code>
                </div>
                <p className="text-gray-500 text-[10px]">{t.type.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        );
      } else {
        // Show transformation rules that will be applied
        return (
          <div className="space-y-2 p-3">
            <p className="text-xs font-semibold text-purple-700 mb-3">Normalization Rules</p>
            {[
              { rule: 'Unit Conversion', example: 'lbs → kg, gallons → liters' },
              { rule: 'Date Standardization', example: '1/15/25 → 2025-01-15' },
              { rule: 'SKU Mapping', example: 'Vendor codes → Internal SKUs' },
              { rule: 'Name Normalization', example: 'JOHN DOE → John Doe' },
              { rule: 'Location Parsing', example: 'Zone 3, Row 12 → Z3-R12' },
            ].map((r, i) => (
              <div key={i} className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-xs">
                <p className="font-medium text-purple-900">{r.rule}</p>
                <code className="text-gray-600 text-[10px]">{r.example}</code>
              </div>
            ))}
            <p className="text-xs text-gray-500 mt-2 text-center italic">Runs automatically when sources complete</p>
          </div>
        );
      }
    }

    if (infoNodeId === 'processing') {
      // For incidents use case, show AI analysis results
      if (selectedUseCase?.id === 'incidents') {
        if (incidents.length > 0) {
          const criticalCount = incidents.filter(i => i.severity >= 4).length;
          const reviewCount = incidents.filter(i => i.severity <= 3).length;
          const avgConfidence = incidents.reduce((sum, i) => sum + (i.ai_confidence || 80), 0) / incidents.length;

          return (
            <div className="space-y-2 p-3">
              <p className="text-xs font-semibold text-indigo-700 mb-3">AI Vision Analysis Results</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-center">
                  <p className="text-xl font-bold text-purple-600">{incidents.length}</p>
                  <p className="text-[10px] text-gray-600">Analyzed</p>
                </div>
                <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-center">
                  <p className="text-xl font-bold text-red-600">{criticalCount}</p>
                  <p className="text-[10px] text-gray-600">Critical</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-center">
                  <p className="text-xl font-bold text-amber-600">{reviewCount}</p>
                  <p className="text-[10px] text-gray-600">Review</p>
                </div>
              </div>
              <div className="mt-2 p-2 rounded-lg bg-green-50 border border-green-200 text-center">
                <p className="text-sm font-bold text-green-600">{Math.round(avgConfidence)}%</p>
                <p className="text-[10px] text-gray-600">Avg AI Confidence</p>
              </div>
              {incidents.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Recent Classifications:</p>
                  {incidents.slice(0, 3).map(i => (
                    <div key={i.id} className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-xs mb-1">
                      <p className="font-semibold text-gray-900">{i.incident_type}</p>
                      <p className="text-gray-600">Severity {i.severity} • {i.ai_confidence || 80}% confident</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        } else {
          return (
            <div className="p-4">
              <p className="text-sm text-gray-700 mb-3">AI Vision Analysis Engine</p>
              <div className="space-y-2 text-xs text-gray-600">
                <p>• Google Gemini Vision analyzes photos</p>
                <p>• Detects incident type (pest, equipment, safety)</p>
                <p>• Assigns severity 1-5</p>
                <p>• Calculates confidence scores</p>
                <p>• Routes per RACI matrix</p>
              </div>
            </div>
          );
        }
      }
      // For other use cases, show reconciliation results
      if (processingStatus === 'complete') {
        return (
          <div className="space-y-2 p-3">
            <p className="text-xs font-semibold text-indigo-700 mb-3">Reconciliation Results</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-green-50 border border-green-200 text-center">
                <p className="text-xl font-bold text-green-600">{processingStats.processed}</p>
                <p className="text-[10px] text-gray-600">Processed</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-center">
                <p className="text-xl font-bold text-amber-600">{processingStats.flagged}</p>
                <p className="text-[10px] text-gray-600">Flagged</p>
              </div>
              <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-center">
                <p className="text-xl font-bold text-red-600">{processingStats.errors}</p>
                <p className="text-[10px] text-gray-600">Errors</p>
              </div>
            </div>
            {discrepancies.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">Top Discrepancies:</p>
                {discrepancies.slice(0, 3).map(d => (
                  <div key={d.id} className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs mb-1">
                    <p className="font-semibold text-gray-900">{d.shipment_id}</p>
                    <p className="text-gray-600">{d.type.replace(/_/g, ' ')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      } else if (processingStatus === 'processing') {
        return (
          <div className="p-4 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-gray-700">Running reconciliation...</p>
          </div>
        );
      } else {
        return (
          <div className="p-4">
            <p className="text-sm text-gray-700 mb-3">Reconciliation Engine</p>
            <div className="space-y-2 text-xs text-gray-600">
              <p>• Compares Expected vs Scanned vs Received</p>
              <p>• Detects quantity mismatches</p>
              <p>• Flags SKU discrepancies</p>
              <p>• Calculates confidence scores</p>
              <p>• Routes critical issues</p>
            </div>
          </div>
        );
      }
    }

    if (infoNodeId === 'review-queue') {
      // For incidents use case, show incidents needing review
      if (selectedUseCase?.id === 'incidents') {
        const reviewIncidents = incidents.filter(i => i.severity <= 3 || (i.ai_confidence && i.ai_confidence < 75));
        if (reviewIncidents.length > 0) {
          return (
            <div className="space-y-2 p-3">
              <p className="text-xs font-semibold text-amber-700 mb-3">Incidents Needing Review ({reviewIncidents.length})</p>
              {reviewIncidents.slice(0, 4).map((i) => (
                <div key={i.id} className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                  <p className="font-semibold text-gray-900">{i.incident_type}</p>
                  <p className="text-gray-700">{i.location} • Reported by {i.reported_by}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      i.severity >= 4 ? 'bg-red-100 text-red-700' :
                      i.severity === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      Severity {i.severity}
                    </span>
                    {i.ai_confidence && i.ai_confidence < 75 && (
                      <span className="text-amber-600 text-[10px]">Low confidence ({i.ai_confidence}%)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        } else {
          return (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">No incidents need review</p>
              <p className="text-xs text-gray-400 mt-1">Low severity or low confidence incidents will appear here</p>
            </div>
          );
        }
      }
      // For shipping/other use cases, show review queue items and decisions
      const pendingItems = reviewQueueItems.filter(item => item.status === 'pending');
      const hasContent = pendingItems.length > 0 || reviewDecisions.length > 0;

      if (hasContent) {
        return (
          <div className="space-y-3 p-3">
            {/* Pending items awaiting review */}
            {pendingItems.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-2">Pending Review ({pendingItems.length})</p>
                {pendingItems.slice(0, 2).map((item) => (
                  <div key={item.id} className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs mb-2">
                    <p className="font-semibold text-gray-900">{item.field_name}</p>
                    <p className="text-gray-700">{item.source_a_label}: {item.source_a_value}</p>
                    <p className="text-gray-700">{item.source_b_label}: {item.source_b_value}</p>
                    <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      item.severity === 'high' ? 'bg-red-100 text-red-700' :
                      item.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.severity} priority
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Recent decisions made by participants */}
            {reviewDecisions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-700 mb-2">Recent Decisions ({reviewDecisions.length})</p>
                {reviewDecisions.slice(0, 3).map((decision) => (
                  <div key={decision.id} className={`p-2 rounded-lg text-xs mb-2 ${
                    decision.decision === 'accept' ? 'bg-green-50 border border-green-200' :
                    decision.decision === 'reject' ? 'bg-red-50 border border-red-200' :
                    'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{decision.decided_by}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        decision.decision === 'accept' ? 'bg-green-200 text-green-800' :
                        decision.decision === 'reject' ? 'bg-red-200 text-red-800' :
                        'bg-gray-200 text-gray-800'
                      }`}>
                        {decision.decision}
                      </span>
                    </div>
                    <p className="text-gray-600 text-[10px] mt-1">{decision.item_type}</p>
                    {decision.comment && (
                      <p className="text-gray-500 text-[10px] italic mt-1">"{decision.comment}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500">No items flagged for review</p>
            <p className="text-xs text-gray-400 mt-1">Scan the QR code to participate</p>
          </div>
        );
      }
    }

    if (infoNodeId === 'escalation') {
      // For incidents use case, show high-severity incidents
      if (selectedUseCase?.id === 'incidents') {
        const criticalIncidents = incidents.filter(i => i.severity >= 4);
        if (criticalIncidents.length > 0) {
          return (
            <div className="space-y-2 p-3">
              <p className="text-xs font-semibold text-red-700 mb-3">Critical Incidents ({criticalIncidents.length})</p>
              {criticalIncidents.slice(0, 4).map((i) => (
                <div key={i.id} className="p-2 rounded-lg bg-red-50 border border-red-200 text-xs">
                  <p className="font-semibold text-gray-900">{i.incident_type}</p>
                  <p className="text-gray-700">{i.location} • {i.reported_by}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      i.severity >= 5 ? 'bg-red-200 text-red-800' : 'bg-red-100 text-red-700'
                    }`}>
                      Severity {i.severity}
                    </span>
                    <span className="text-red-700 text-[10px]">
                      → {i.severity >= 5 ? 'Safety Team' : 'Maintenance Lead'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          );
        } else {
          return (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">No critical incidents</p>
              <p className="text-xs text-gray-400 mt-1">Severity 4-5 incidents will be escalated here</p>
            </div>
          );
        }
      }
      // For other use cases, show escalations from discrepancies
      if (escalations.length > 0) {
        return (
          <div className="space-y-2 p-3">
            <p className="text-xs font-semibold text-red-700 mb-3">Escalated Items ({escalations.length})</p>
            {escalations.map((e) => (
              <div key={e.id} className="p-2 rounded-lg bg-red-50 border border-red-200 text-xs">
                <p className="font-semibold text-gray-900">{e.source_id}</p>
                <p className="text-gray-700">Severity: {e.severity}</p>
                <p className="text-red-700">→ Routed to: {e.routed_to}</p>
              </div>
            ))}
          </div>
        );
      } else {
        return (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500">No critical escalations</p>
            <p className="text-xs text-gray-400 mt-1">High severity items will appear here</p>
          </div>
        );
      }
    }

    if (infoNodeId === 'communications') {
      if (communications.length > 0) {
        return (
          <div className="space-y-2 p-3">
            <p className="text-xs font-semibold text-blue-700 mb-3">Recent Communications ({communications.length})</p>
            {communications.slice(0, 4).map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedEmail(c)}
                className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-xs cursor-pointer hover:bg-blue-100 transition-colors"
              >
                <p className="font-semibold text-gray-900">{c.recipient}</p>
                <p className="text-gray-700">{c.subject}</p>
                <p className="text-blue-600 text-[10px]">{c.comm_type.toUpperCase()}</p>
              </div>
            ))}
          </div>
        );
      } else {
        return (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500">No communications yet</p>
            <p className="text-xs text-gray-400 mt-1">Notifications will appear after processing</p>
          </div>
        );
      }
    }

    if (infoNodeId === 'intake') {
      // For incidents use case, show submitted incidents
      if (selectedUseCase?.id === 'incidents' && incidents.length > 0) {
        return (
          <div className="space-y-2 p-3">
            <p className="text-xs font-semibold text-purple-700 mb-3">Submitted Incidents ({incidents.length})</p>
            {incidents.slice(0, 4).map((i) => (
              <div key={i.id} className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-xs">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{i.incident_type}</p>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    i.severity >= 5 ? 'bg-red-200 text-red-800' :
                    i.severity === 4 ? 'bg-red-100 text-red-700' :
                    i.severity === 3 ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {i.severity}
                  </span>
                </div>
                <p className="text-gray-600 text-[10px] mt-1">{i.location} • {i.reported_by}</p>
              </div>
            ))}
          </div>
        );
      }
      return (
        <div className="p-4">
          <p className="text-sm text-gray-700 mb-3">Data sources ready for processing</p>
          <div className="space-y-1">
            {selectedUseCase?.sources.map(s => (
              <div key={s.name} className="flex items-center gap-2 p-2 rounded bg-blue-50 text-xs">
                <span className={`w-2 h-2 rounded-full ${sourceStatuses[s.name] === 'complete' ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-gray-700">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (infoNodeId === 'output') {
      return (
        <div className="p-4">
          <p className="text-sm font-semibold text-emerald-700 mb-3">Generated Reports</p>
          <div className="space-y-2">
            {outputFiles.map(f => (
              <div key={f.id} className={`p-3 rounded-xl text-xs transition-all ${
                f.ready
                  ? 'bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 shadow-sm'
                  : 'bg-gray-100 border border-gray-200 opacity-60'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* File type icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      f.type === 'pdf' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      {f.type === 'pdf' ? (
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{f.name}</p>
                      <p className={`text-[10px] ${f.ready ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {f.type.toUpperCase()} • {f.ready ? 'Ready to download' : 'Processing...'}
                      </p>
                    </div>
                  </div>
                  {/* Action buttons */}
                  {f.ready && (
                    <div className="flex items-center gap-1">
                      {/* Preview button */}
                      <button
                        onClick={() => {
                          if (f.id === 'reconciliation-report' && reconciliationReport) {
                            setShowReportModal(true);
                          } else if (f.id === 'incident-summary' || f.id === 'incident-report') {
                            // Trigger incident report modal
                            const now = new Date();
                            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                            const reportData: IncidentReportData = {
                              reportPeriod: `${weekAgo.toLocaleDateString()} - ${now.toLocaleDateString()}`,
                              generatedAt: now.toLocaleString(),
                              incidents: incidents.map(inc => ({
                                id: inc.id || `inc-${Math.random().toString(36).substr(2, 9)}`,
                                incident_type: inc.incident_type || 'Unknown',
                                severity: inc.severity || 3,
                                location: inc.location || 'Unknown location',
                                description: inc.description || 'No description provided',
                                reported_by: inc.reported_by || 'Anonymous',
                                reported_at: inc.reported_at || new Date().toISOString(),
                                status: inc.status || 'Open',
                                photo_url: inc.photo_url,
                                ai_confidence: inc.ai_confidence,
                                routed_to: inc.status === 'Escalated' ? 'Safety Team' : undefined,
                              })),
                              statistics: {
                                total: incidents.length,
                                critical: incidents.filter(i => (i.severity || 0) >= 4).length,
                                moderate: incidents.filter(i => (i.severity || 0) === 3).length,
                                minor: incidents.filter(i => (i.severity || 0) <= 2).length,
                                resolved: incidents.filter(i => i.status === 'Resolved').length,
                                pending: incidents.filter(i => i.status !== 'Resolved').length,
                              },
                            };
                            setIncidentReport(reportData);
                            setShowIncidentReportModal(true);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-white transition-colors group"
                        title="Preview"
                      >
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-bmf-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {/* Download button */}
                      <button
                        onClick={async () => {
                          if (f.type === 'pdf' && reconciliationReport) {
                            const participation = await buildParticipationData();
                            const pdfBlob = generatePDF(reconciliationReport, participation);
                            const filename = `${f.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
                            downloadBlob(pdfBlob, filename);
                          } else if (f.type === 'csv' && reconciliationReport) {
                            const csvBlob = f.id.includes('discrepancy')
                              ? generateDiscrepancyCSV(reconciliationReport)
                              : generateFullDataCSV(reconciliationReport);
                            const filename = `${f.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
                            downloadBlob(csvBlob, filename);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-white transition-colors group"
                        title="Download"
                      >
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {outputFiles.length > 0 && outputFiles.every(f => f.ready) && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-100 border border-emerald-200 text-center">
              <p className="text-xs text-emerald-700 font-medium">All reports ready for download</p>
            </div>
          )}
        </div>
      );
    }

    // Find the source that matches
    const source = selectedUseCase.sources.find(s => `source-${s.name}` === infoNodeId);
    if (!source) {
      debug.log('No source found for infoNodeId:', infoNodeId);
      return null;
    }

    const data = sourceData[source.name] || {};
    debug.log('Building preview for:', source.type, 'with data:', data, 'use case:', selectedUseCase.id);

    // Barcode preview - use BarcodeScanMiniApp with scan log and shipping labels toggle
    if (source.type === 'barcode') {
      debug.log('Rendering barcode preview with labels toggle');
      return <BarcodeScanMiniApp sessionCode={sessionCode} />;
    }

    // Always show preview - with demo data or "awaiting" state
    // No scaling - match flowchart appearance exactly
    if (source.type === 'outlook') {
      const emails = data.emails || generateDemoEmails();
      return <OutlookMiniApp emails={emails} isLoading={false} />;
    }

    if (source.type === 'onedrive') {
      const files = data.files || generateDemoFiles();
      return <OneDriveMiniApp files={files} isLoading={false} />;
    }

    if (source.type === 'excel') {
      // Route to correct spreadsheet based on use case and source name
      let spreadsheet = data.spreadsheet;
      if (!spreadsheet) {
        if (selectedUseCase.id === 'training') {
          spreadsheet = source.name === 'Acknowledgements'
            ? generateTrainingAcknowledgements()
            : generateTrainingRoster();
        } else if (selectedUseCase.id === 'incidents' && source.name.toLowerCase().includes('raci')) {
          // Business Rules & RACI Matrix for incident routing
          spreadsheet = {
            sheetName: 'Business Rules & RACI',
            headers: ['Severity', 'Category', 'Responsible', 'Accountable', 'Consulted', 'Informed'],
            rows: [
              ['5 - Critical', 'Safety Hazard', 'Safety Team', 'Maria Santos (Safety Mgr)', 'Ops Director', 'safety@bigmarblefarms.com'],
              ['5 - Critical', 'Equipment Failure', 'Maintenance Lead', 'Maria Santos (Safety Mgr)', 'Ops Director', 'maintenance.lead@bigmarblefarms.com'],
              ['4 - Urgent', 'Pest/Disease', 'Head Grower', 'Roberto Chen (Ops Mgr)', 'Quality Team', 'head.grower@bigmarblefarms.com'],
              ['4 - Urgent', 'Equipment Issue', 'Maintenance Team', 'James Wilson (Maint Lead)', 'Shift Lead', 'maintenance@bigmarblefarms.com'],
              ['3 - Moderate', 'Irrigation Leak', 'Shift Lead', 'Roberto Chen (Ops Mgr)', '-', 'shift.lead@bigmarblefarms.com'],
              ['3 - Moderate', 'Environmental', 'Head Grower', 'Roberto Chen (Ops Mgr)', '-', 'head.grower@bigmarblefarms.com'],
              ['2 - Minor', 'Housekeeping', 'Shift Lead', 'Shift Lead', '-', 'Log Only'],
              ['1 - Info', 'General Observation', 'Reporter', 'Shift Lead', '-', 'Log Only'],
            ],
          };
        } else {
          spreadsheet = generateDemoSpreadsheet();
        }
      }
      return (
        <ExcelMiniApp
          data={spreadsheet}
          isLoading={false}
          onCellEdit={selectedUseCase.id === 'shipping' ? handleExcelCellEdit : undefined}
          editable={true}
        />
      );
    }

    // Paper nodes - show actual upload interface with QR code
    if (source.type === 'paper') {
      // Generate QR code URL for this source
      const qrCodeUrl = `${window.location.origin}/upload/${sessionCode}/${encodeURIComponent(source.name)}`;

      return (
        <PaperScanMiniApp
          capturedImage={data.capturedImage}
          extractedFields={data.extractedFields}
          isAnalyzing={false}
          qrCodeUrl={qrCodeUrl}
        />
      );
    }

    return null;
  };

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[600px]">
      {/* Control buttons - floating */}
      {selectedUseCase && !isTheoryMode && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {hasPositionOverrides && (
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={handleResetPositions}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              Reset Layout
            </GlassButton>
          )}
          <GlassButton
            variant={isSimulating ? 'primary' : 'secondary'}
            size="sm"
            onClick={toggleSimulation}
            icon={isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          >
            {isSimulating ? 'Pause Pipeline' : 'Auto Pipeline'}
          </GlassButton>
        </div>
      )}

      {/* Theory Mode: Show TheoryPresentation inline */}
      {isTheoryMode && (
        <div className="absolute inset-0 flex">
          {/* Selector panel on left */}
          <div className="w-[280px] p-4 bg-stone-100/50 border-r border-stone-200">
            <div className="mb-4 px-1">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Sections
              </h3>
            </div>
            <div className="bg-white rounded-xl border-2 border-purple-500 shadow-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Document Processing AI</p>
                  <p className="text-xs text-gray-500">Theory Section</p>
                </div>
              </div>
              <button
                onClick={() => setIsTheoryMode(false)}
                className="mt-4 w-full text-xs text-purple-600 hover:text-purple-700 underline"
              >
                Switch to Use Cases
              </button>
            </div>
          </div>
          {/* TheoryPresentation on right */}
          <div className="flex-1 overflow-hidden">
            <TheoryPresentation
              embedded
              onClose={() => setIsTheoryMode(false)}
              onProceedToCalibration={() => {
                setIsTheoryMode(false);
                setShowCalibration(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Calibration Slide - between theory and use cases */}
      {showCalibration && (
        <CalibrationSlide
          sessionCode={sessionCode}
          onBack={() => {
            setShowCalibration(false);
            setIsTheoryMode(true);
          }}
          onProceed={() => {
            setShowCalibration(false);
            // Show the "Up Next: Shipping & Receiving" transition slide
            const theoryTransition = getNodeInfo('theory', 'upNext');
            if (theoryTransition) {
              setInfoOverlayContent(theoryTransition);
              setInfoNodeId('theory-transition');
              setInfoNodeType('upNext');
              setInfoNodeLabel('Shipping & Receiving');
              setInfoNodeFetchHandler(null);
              setInfoNodeCanFetch(false);
            }
            // Pre-select shipping use case so nodes load in background
            if (useCases.length > 0) {
              const firstUseCase = useCases.find(uc => uc.id === 'shipping') || useCases[0];
              handleUseCaseSelect(firstUseCase);
            }
          }}
        />
      )}

      {/* Normal Flow Mode */}
      {!isTheoryMode && (
        <ReactFlow
        nodes={buildNodes()}
        edges={buildEdges()}
        nodeTypes={nodeTypes}
        fitView={!!selectedUseCase && !hasInitialFit} // Only fitView once
        onInit={() => setHasInitialFit(true)}
        fitViewOptions={{ padding: 0.3, maxZoom: 0.85 }}
        defaultViewport={{ x: 150, y: 200, zoom: 0.85 }} // Start with selector on left
        nodesDraggable={true}
        nodesConnectable={false}
        zoomOnScroll={true}
        panOnScroll={true}
        panOnDrag={true}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, node) => handleNodeClick(node.id)}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        onPaneClick={handlePaneClick}
        className="bg-transparent"
      >
        <Background color="#d6d3d1" gap={24} size={1} />
        <Controls
          showInteractive={false}
          className="!bg-white/80 !backdrop-blur-sm !border-stone-200 !rounded-lg !shadow-sm [&>button]:!bg-white [&>button]:!border-stone-200 [&>button]:!text-stone-600 [&>button:hover]:!bg-stone-50"
        />
      </ReactFlow>
      )}

      {/* Expanded node modal */}
      {expandedNode && (
        <ExpandedNodeModal
          nodeType={expandedNode.type}
          label={expandedNode.label}
          onClose={() => setExpandedNode(null)}
          sessionCode={sessionCode}
          emails={getExpandedSourceData().emails}
          files={getExpandedSourceData().files}
          spreadsheet={getExpandedSourceData().spreadsheet}
          capturedImage={getExpandedSourceData().capturedImage}
          onSpreadsheetUpdate={(data) => {
            // Update local state when spreadsheet changes
            const currentData = sourceData['Expected Shipments'];
            setSourceData(prev => ({
              ...prev,
              'Expected Shipments': {
                ...currentData,
                spreadsheet: data,
              },
            }));
          }}
          onAddRow={selectedUseCase?.id === 'shipping' ? handleAddRow : undefined}
          qrCodeUrl={`${window.location.origin}/upload/${sessionCode}/${encodeURIComponent(expandedNode.label)}`}
        />
      )}

      {/* Info overlay */}
      <InfoOverlay
        info={infoOverlayContent}
        onClose={() => {
          setInfoOverlayContent(null);
          setInfoNodeId(null);
          setInfoNodeType(null);
          setInfoNodeLabel(null);
          setInfoNodeFetchHandler(null);
          setInfoNodeCanFetch(false);
          setPresentationActiveNode(null);
        }}
        nodePreviewContent={getNodePreviewContent()}
        onFetchData={infoNodeFetchHandler || undefined}
        canFetch={infoNodeCanFetch}
        onNext={handleNextSlide}
        onPrevious={handlePreviousSlide}
        hasNext={(() => {
          if (!infoNodeId) return false;
          const navOrder = getNavigationOrder();
          const currentIdx = navOrder.findIndex(n => n.id === infoNodeId);
          return currentIdx >= 0 && currentIdx < navOrder.length - 1;
        })()}
        hasPrevious={(() => {
          if (!infoNodeId) return false;
          const navOrder = getNavigationOrder();
          const currentIdx = navOrder.findIndex(n => n.id === infoNodeId);
          return currentIdx > 0;
        })()}
        imageUrl={infoNodeType && selectedUseCase && infoNodeLabel ? getNodeImage(selectedUseCase.id, infoNodeType, infoNodeLabel) : null}
        nodeType={infoNodeType || undefined}
        nodeLabel={infoNodeLabel || undefined}
        sessionCode={sessionCode}
        useCase={selectedUseCase?.id}
        onMaximize={() => {
          // Trigger full modal (same as clicking node in flowchart mode)
          if (infoNodeType && infoNodeLabel) {
            setExpandedNode({
              id: infoNodeLabel,
              type: infoNodeType as 'outlook' | 'onedrive' | 'excel' | 'paper' | 'barcode',
              label: infoNodeLabel,
            });
          }
        }}
        isTransitionSlide={infoNodeType === 'upNext'}
        nextUseCaseInfo={
          infoNodeId === 'theory-transition'
            ? getFirstUseCase()
            : (selectedUseCase ? getNextUseCase(selectedUseCase.id) : null)
        }
        onStartNextUseCase={
          infoNodeId === 'theory-transition'
            ? () => {
                // Theory transition: start the first source slide of shipping
                if (selectedUseCase && selectedUseCase.sources.length > 0) {
                  const firstSource = selectedUseCase.sources[0];
                  handleShowInfo(
                    firstSource.type,
                    `source-${firstSource.name}`,
                    firstSource.name,
                    0,
                    undefined,
                    'pending',
                    selectedUseCase.id // Pass use case ID explicitly
                  );
                }
              }
            : handleTransitionToNextUseCase
        }
      />

      {/* Discrepancy List Modal */}
      {showDiscrepancyList && discrepancies.length > 0 && (
        <DiscrepancyListModal
          discrepancies={discrepancies}
          onClose={() => setShowDiscrepancyList(false)}
          onSelectDiscrepancy={(disc) => {
            setSelectedDiscrepancy(disc);
            setShowDiscrepancyList(false);
          }}
        />
      )}

      {/* Detailed Decision Modal */}
      {selectedDiscrepancy && (
        <DiscrepancyDecisionModal
          discrepancy={selectedDiscrepancy}
          onClose={() => setSelectedDiscrepancy(null)}
          onDecision={handleDiscrepancyDecision}
        />
      )}

      {/* Reconciliation Report Modal */}
      {showReportModal && reconciliationReport && (
        <ReportModal
          report={reconciliationReport}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Incident Report Modal */}
      {showIncidentReportModal && incidentReport && (
        <IncidentReportModal
          report={incidentReport}
          onClose={() => setShowIncidentReportModal(false)}
        />
      )}

      {/* Email Viewer Modal */}
      {selectedEmail && (
        <EmailViewerModal
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
          onSendReply={async (replyBody) => {
            // Log reply to communications
            const newComm = {
              id: `reply-${Date.now()}`,
              comm_type: 'email',
              recipient: selectedEmail.recipient,
              subject: `RE: ${selectedEmail.subject}`,
              body: replyBody,
              sent_at: new Date().toISOString(),
            };
            setCommunications(prev => [newComm, ...prev]);

            // Save to Supabase
            await supabase.from('communications_log').insert({
              session_code: sessionCode,
              comm_type: 'email',
              recipient: selectedEmail.recipient,
              subject: `RE: ${selectedEmail.subject}`,
              body: replyBody,
            });
          }}
        />
      )}

      {/* Floating AI Assistant - Only visible on output/final slide */}
      {selectedUseCase && infoNodeId === 'output' && (
        <FloatingAIAssistant
          context={{
            useCase: selectedUseCase.id,
            sessionCode,
            discrepancies: discrepancies.map(d => ({
              type: d.type,
              severity: d.severity,
              details: d.details,
            })),
            extractedData: sourceData,
          }}
          reconciliationReport={reconciliationReport}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onClose={closeToast} />

      {/* Participant activity log */}
      {selectedUseCase && (
        <ParticipantActivityLog sessionCode={sessionCode} />
      )}
    </div>
  );
}
