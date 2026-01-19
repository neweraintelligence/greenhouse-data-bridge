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
import { OutlookMiniApp } from './nodes/mini-apps/OutlookMiniApp';
import { OneDriveMiniApp } from './nodes/mini-apps/OneDriveMiniApp';
import { ExcelMiniApp } from './nodes/mini-apps/ExcelMiniApp';
import { PaperScanMiniApp } from './nodes/mini-apps/PaperScanMiniApp';
import { ScanBarcode } from 'lucide-react';
import type { IntakeItem } from './nodes/IntakeNode';
import type { OutputFile } from './nodes/OutputNode';
import type { UseCase } from '../../lib/useCases/types';
import type { EmailItem } from './nodes/mini-apps/OutlookMiniApp';
import type { FileItem } from './nodes/mini-apps/OneDriveMiniApp';
import type { SpreadsheetData } from './nodes/mini-apps/ExcelMiniApp';
import { getAllUseCases } from '../../lib/useCases/registry';
import { getNodeInfo } from '../../lib/nodeInfoContent';
import { getNodeImage } from '../../lib/nodeImages';
import { GlassButton } from '../design-system';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { reconcileShipments } from '../../lib/processing/compareShipments';
import { supabase } from '../../lib/supabase';
import type { Discrepancy } from '../../lib/processing/types';
import { generateEscalationEmail } from '../../lib/ai/geminiService';

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

export function FlowCanvas({ sessionCode, onProcessComplete, startPresentationMode, onPresentationStart }: FlowCanvasProps) {
  const useCases = getAllUseCases();

  // Selected use case
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase | null>(null);

  // Track focused node for focus mode
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  // Track progressive reveal for presentation mode
  const [revealedNodeIndices, setRevealedNodeIndices] = useState<Set<number>>(new Set());

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

  // Track outputs
  const [outputFiles, setOutputFiles] = useState<OutputFile[]>([]);

  // Track expanded node for modal view
  const [expandedNode, setExpandedNode] = useState<{
    id: string;
    type: 'outlook' | 'onedrive' | 'excel' | 'paper';
    label: string;
  } | null>(null);

  // Track discrepancy list modal
  const [showDiscrepancyList, setShowDiscrepancyList] = useState(false);
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<Discrepancy | null>(null);

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
  const [infoNodeIndex, setInfoNodeIndex] = useState<number | null>(null);
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
  const handleExpandNode = useCallback((sourceName: string, sourceType: 'outlook' | 'onedrive' | 'excel' | 'paper' | 'barcode') => {
    // Only expand for supported types
    if (sourceType === 'barcode') return;
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

      console.log('Decision saved:', decision, selectedDiscrepancy.id);
    } catch (error) {
      console.error('Error saving decision:', error);
    }
  }, [selectedDiscrepancy, sessionCode]);

  // Handle show info overlay
  const handleShowInfo = useCallback((
    nodeType: string,
    nodeId: string,
    sourceName: string,
    sourceIndex: number,
    onActivate?: () => void,
    status?: string
  ) => {
    const useCaseId = selectedUseCase?.id || 'shipping';
    const info = getNodeInfo(useCaseId, nodeType, sourceName);
    if (info) {
      setInfoOverlayContent(info);
      setInfoNodeId(nodeId);
      setInfoNodeIndex(sourceIndex);
      setInfoNodeType(nodeType);
      setInfoNodeLabel(sourceName);

      // Auto-reveal this node and all previous nodes when navigating to slide
      if (sourceIndex >= 0) {
        setRevealedNodeIndices(prev => {
          const newSet = new Set(prev);
          for (let i = 0; i <= sourceIndex; i++) {
            newSet.add(i);
          }
          return newSet;
        });
      }

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

  // Handle use case selection
  const handleUseCaseSelect = useCallback((useCase: UseCase) => {
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
    // Start with only first source node revealed for progressive presentation
    setRevealedNodeIndices(new Set([0]));
  }, []);

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
          } else {
            newData.spreadsheet = generateDemoSpreadsheet();
          }
        } else if (sourceType === 'outlook') {
          // Generate email from actual order data
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
        } else if (sourceType === 'onedrive') {
          newData.files = generateDemoFiles();
        }

        setSourceData((prev) => ({ ...prev, [sourceName]: newData }));
        setSourceStatuses((prev) => ({ ...prev, [sourceName]: 'complete' }));
      } catch (error) {
        console.error('Error fetching source data:', error);
        setSourceStatuses((prev) => ({ ...prev, [sourceName]: 'complete' }));
      }
    }, 2500 + Math.random() * 1000);
  }, [selectedUseCase, sessionCode]);

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
        setTimeout(() => {
          clearInterval(interval);
          setProcessingProgress(100);

          const stats = {
            processed: result.totalProcessed,
            flagged: result.totalFlagged,
            errors: 0,
          };
          setProcessingStats(stats);
          setDiscrepancies(result.discrepancies);

          // Generate escalations for critical/high severity discrepancies
          const newEscalations = result.discrepancies
            .filter(d => d.severity === 'critical' || d.severity === 'high')
            .map(d => ({
              id: `esc-${d.id}`,
              source_type: 'discrepancy',
              source_id: d.shipment_id,
              severity: d.severity,
              routed_to: d.severity === 'critical' ? 'Operations Manager' : 'Warehouse Supervisor',
              status: 'pending',
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
                console.error('Error generating escalation email:', error);
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

          setCommunications(newCommunications);
          setProcessingStatus('complete');
          setFocusedNodeId('output');

          // Mark outputs as ready
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
      console.error('Processing error:', error);
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

  // Navigate to next/previous slide
  const handleNextSlide = useCallback(() => {
    if (!selectedUseCase || infoNodeIndex === null) return;
    const nextIndex = infoNodeIndex + 1;
    if (nextIndex < selectedUseCase.sources.length) {
      const nextSource = selectedUseCase.sources[nextIndex];
      const nextNodeId = `source-${nextSource.name}`;
      handleShowInfo(
        nextSource.type,
        nextNodeId,
        nextSource.name,
        nextIndex,
        () => handleSourceActivate(nextSource.name, nextSource.type),
        sourceStatuses[nextSource.name]
      );
    }
  }, [selectedUseCase, infoNodeIndex, handleShowInfo, handleSourceActivate, sourceStatuses]);

  const handlePreviousSlide = useCallback(() => {
    if (!selectedUseCase || infoNodeIndex === null) return;
    const prevIndex = infoNodeIndex - 1;
    if (prevIndex >= 0) {
      const prevSource = selectedUseCase.sources[prevIndex];
      const prevNodeId = `source-${prevSource.name}`;
      handleShowInfo(
        prevSource.type,
        prevNodeId,
        prevSource.name,
        prevIndex,
        () => handleSourceActivate(prevSource.name, prevSource.type),
        sourceStatuses[prevSource.name]
      );
    }
  }, [selectedUseCase, infoNodeIndex, handleShowInfo, handleSourceActivate, sourceStatuses]);

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

  // Subscribe to realtime barcode scans
  useEffect(() => {
    if (!sessionCode) return;

    const channel = supabase
      .channel(`barcode-scans-${sessionCode}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'barcode_scans',
          filter: `session_code=eq.${sessionCode}`,
        },
        (payload) => {
          console.log('New barcode scan detected:', payload.new);
          const scan = payload.new as {shipment_id: string; sku: string; qty_scanned: number; scanned_at: string};
          setLiveScans(prev => [scan, ...prev]);

          // TODO: Validate scan against expected shipments
          // TODO: Show toast notification for successful/error scans
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionCode]);

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

        // Check if this node is revealed for progressive presentation
        const isRevealed = revealedNodeIndices.has(index);

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
          className: isUnfocused ? 'node-unfocused' : isFocused ? 'node-focused' : !isRevealed ? 'node-unrevealed' : '',
        });
      });

      // ETL/Normalization node (NEW - between sources and intake)
      const etlIsFocused = focusedNodeId === 'etl';
      const etlIsUnfocused = focusedNodeId && !etlIsFocused;
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
        className: etlIsUnfocused ? 'node-unfocused' : etlIsFocused ? 'node-focused' : '',
      });

      // Intake node
      const intakeIsFocused = focusedNodeId === 'intake';
      const intakeIsUnfocused = focusedNodeId && !intakeIsFocused;
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
        className: intakeIsUnfocused ? 'node-unfocused' : intakeIsFocused ? 'node-focused' : '',
      });

      // Processing node - build source statuses for status messages
      const processingSourceStatuses = selectedUseCase.sources.map(s => ({
        name: s.name,
        received: sourceStatuses[s.name] === 'complete',
      }));

      const processingIsFocused = focusedNodeId === 'processing';
      const processingIsUnfocused = focusedNodeId && !processingIsFocused;
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
        className: processingIsUnfocused ? 'node-unfocused' : processingIsFocused ? 'node-focused' : '',
      });

      // Review Queue node (NEW - branch from processing)
      const reviewQueueItems = discrepancies.slice(0, 5).map(d => ({
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
          items: reviewQueueItems,
          onViewQueue: () => setShowDiscrepancyList(true),
          onShowInfo: () => handleShowInfo('reviewQueue', 'review-queue', 'Review Queue', -1, undefined, undefined),
        },
      });

      // Escalation node (NEW - branch from processing)
      const criticalEscalations = discrepancies
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
          onViewEscalations: () => console.log('View escalations'),
          onShowInfo: () => handleShowInfo('escalation', 'escalation', 'Escalation Router', -1, undefined, undefined),
        },
      });

      // Communications node (NEW - parallel to output)
      nodes.push({
        id: 'communications',
        type: 'communications',
        position: getPosition('communications', { x: xSpacing * 5, y: 400 }),
        data: {
          label: 'Communications',
          communications: communications,
          onViewCommunications: () => console.log('View communications'),
          onShowInfo: () => handleShowInfo('communications', 'communications', 'Communications', -1, undefined, undefined),
        },
      });

      // Output node (repositioned)
      const outputIsFocused = focusedNodeId === 'output';
      const outputIsUnfocused = focusedNodeId && !outputIsFocused;
      nodes.push({
        id: 'output',
        type: 'output',
        position: getPosition('output', { x: xSpacing * 6 - 40, y: 140 }),
        data: {
          label: 'Reports',
          files: outputFiles,
          onPreview: (file: OutputFile) => console.log('Preview:', file),
          onDownload: (file: OutputFile) => console.log('Download:', file),
        },
        className: outputIsUnfocused ? 'node-unfocused' : outputIsFocused ? 'node-focused' : '',
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
    etlStatus,
    transformations,
    escalations,
    communications,
    outputFiles,
    focusedNodeId,
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
          stroke: isComplete ? '#10b981' : isLoading ? '#2596be' : '#e2e8f0',
          strokeWidth: isComplete ? 2.5 : 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isComplete ? '#10b981' : isLoading ? '#2596be' : '#e2e8f0',
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
        stroke: etlComplete ? '#a855f7' : '#e2e8f0',
        strokeWidth: etlComplete ? 2.5 : 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: etlComplete ? '#a855f7' : '#e2e8f0',
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
        stroke: isComplete ? '#10b981' : isProcessing ? '#8b5cf6' : '#e2e8f0',
        strokeWidth: isComplete || isProcessing ? 2.5 : 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isComplete ? '#10b981' : isProcessing ? '#8b5cf6' : '#e2e8f0',
      },
    });

    // Branching edges from processing
    if (isComplete) {
      // To Review Queue (if flagged items exist)
      if (discrepancies.length > 0) {
        edges.push({
          id: 'edge-processing-review',
          source: 'processing',
          target: 'review-queue',
          style: {
            stroke: '#f59e0b',
            strokeWidth: 2.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#f59e0b',
          },
        });
      }

      // To Escalation (if critical items)
      const hasCritical = discrepancies.some(d => d.severity === 'critical' || d.severity === 'high');
      if (hasCritical) {
        edges.push({
          id: 'edge-processing-escalation',
          source: 'processing',
          target: 'escalation',
          style: {
            stroke: '#ef4444',
            strokeWidth: 2.5,
            strokeDasharray: '5,5',
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#ef4444',
          },
        });
      }

      // To Communications
      if (communications.length > 0) {
        edges.push({
          id: 'edge-processing-communications',
          source: 'processing',
          target: 'communications',
          style: {
            stroke: '#3b82f6',
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#3b82f6',
          },
        });
      }

      // To Output (always)
      edges.push({
        id: 'edge-processing-output',
        source: 'processing',
        target: 'output',
        style: {
          stroke: '#10b981',
          strokeWidth: 2.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#10b981',
        },
      });
    }

    return edges;
  }, [selectedUseCase, sourceStatuses, etlStatus, processingStatus, discrepancies, communications]);

  // Get source data for expanded modal
  const getExpandedSourceData = () => {
    if (!expandedNode) return {};
    return sourceData[expandedNode.id] || {};
  };

  // Check if any positions have been overridden
  const hasPositionOverrides = Object.keys(nodePositionOverrides).length > 0;

  // Build node preview content for info overlay
  const getNodePreviewContent = (): React.ReactNode => {
    if (!infoNodeId || !selectedUseCase) {
      console.log('No infoNodeId or selectedUseCase');
      return null;
    }

    // Find the source that matches
    const source = selectedUseCase.sources.find(s => `source-${s.name}` === infoNodeId);
    if (!source) {
      console.log('No source found for infoNodeId:', infoNodeId);
      return null;
    }

    const data = sourceData[source.name] || {};
    console.log('Building preview for:', source.type, 'with data:', data, 'use case:', selectedUseCase.id);

    // Barcode always has preview (hardcoded data) - check first
    if (source.type === 'barcode') {
      console.log('Rendering barcode preview - always available');
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-2">
            <ScanBarcode className="w-3 h-3" />
            <span>Recent scans</span>
          </div>
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {[
              { code: 'SHP-2025-0001', time: '10:42 AM', type: 'Shipment', sku: 'SKU-3382' },
              { code: 'PLT-8847-A', time: '10:38 AM', type: 'Pallet', sku: 'SKU-1247' },
              { code: 'SHP-2025-0002', time: '10:35 AM', type: 'Shipment', sku: 'SKU-5891' },
              { code: 'BOX-44521', time: '10:31 AM', type: 'Box', sku: 'SKU-7733' },
            ].map((entry, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-gray-50 text-xs">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-violet-600 font-semibold text-[11px]">{entry.code}</code>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-600">
                      {entry.type}
                    </span>
                  </div>
                  <code className="font-mono text-gray-500 text-[10px]">{entry.sku}</code>
                </div>
                <span className="text-gray-400 text-[10px]">{entry.time}</span>
              </div>
            ))}
          </div>
        </div>
      );
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
        } else {
          spreadsheet = generateDemoSpreadsheet();
        }
      }
      return <ExcelMiniApp data={spreadsheet} isLoading={false} />;
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
      {selectedUseCase && (
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

      <ReactFlow
        nodes={buildNodes()}
        edges={buildEdges()}
        nodeTypes={nodeTypes}
        fitView={!!selectedUseCase} // Only fitView after use case is selected
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

      {/* Expanded node modal */}
      {expandedNode && (
        <ExpandedNodeModal
          nodeType={expandedNode.type}
          label={expandedNode.label}
          onClose={() => setExpandedNode(null)}
          emails={getExpandedSourceData().emails}
          files={getExpandedSourceData().files}
          spreadsheet={getExpandedSourceData().spreadsheet}
          capturedImage={getExpandedSourceData().capturedImage}
        />
      )}

      {/* Info overlay */}
      <InfoOverlay
        info={infoOverlayContent}
        onClose={() => {
          setInfoOverlayContent(null);
          setInfoNodeId(null);
          setInfoNodeIndex(null);
          setInfoNodeType(null);
          setInfoNodeLabel(null);
          setInfoNodeFetchHandler(null);
          setInfoNodeCanFetch(false);
        }}
        nodePreviewContent={getNodePreviewContent()}
        onFetchData={infoNodeFetchHandler || undefined}
        canFetch={infoNodeCanFetch}
        onNext={handleNextSlide}
        onPrevious={handlePreviousSlide}
        hasNext={infoNodeIndex !== null && selectedUseCase ? infoNodeIndex < selectedUseCase.sources.length - 1 : false}
        hasPrevious={infoNodeIndex !== null ? infoNodeIndex > 0 : false}
        imageUrl={infoNodeType && selectedUseCase && infoNodeLabel ? getNodeImage(selectedUseCase.id, infoNodeType, infoNodeLabel) : null}
        nodeType={infoNodeType || undefined}
        nodeLabel={infoNodeLabel || undefined}
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
    </div>
  );
}
