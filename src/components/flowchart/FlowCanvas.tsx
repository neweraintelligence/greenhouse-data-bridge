import { useCallback, useState } from 'react';
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
import type { IntakeItem } from './nodes/IntakeNode';
import type { OutputFile } from './nodes/OutputNode';
import type { UseCase } from '../../lib/useCases/types';
import type { EmailItem } from './nodes/mini-apps/OutlookMiniApp';
import type { FileItem } from './nodes/mini-apps/OneDriveMiniApp';
import type { SpreadsheetData } from './nodes/mini-apps/ExcelMiniApp';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: Record<string, any> = {
  source: SourceNode,
  intake: IntakeNode,
  processing: ProcessingNode,
  output: OutputNode,
};

interface FlowCanvasProps {
  useCase: UseCase;
  sessionCode: string;
  onProcessComplete?: (stats: { processed: number; flagged: number }) => void;
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
    headers: ['Date', 'Shipment ID', 'Vendor', 'Qty'],
    rows: [
      ['2025-01-06', 'SHP-0001', 'GreenLine', 980],
      ['2025-01-08', 'SHP-0002', 'NorthStar', 1200],
      ['2025-01-10', 'SHP-0003', 'Valley', 860],
      ['2025-01-12', 'SHP-0004', 'Coastal', 540],
    ],
  };
}

export function FlowCanvas({ useCase, onProcessComplete }: FlowCanvasProps) {
  // Track source statuses
  const [sourceStatuses, setSourceStatuses] = useState<Record<string, 'pending' | 'loading' | 'complete'>>(
    Object.fromEntries(useCase.sources.map((s) => [s.name, 'pending']))
  );

  // Track source data
  const [sourceData, setSourceData] = useState<Record<string, {
    emails?: EmailItem[];
    files?: FileItem[];
    spreadsheet?: SpreadsheetData;
    capturedImage?: string;
  }>>({});

  // Track processing state
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'complete'>('idle');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStats, setProcessingStats] = useState({ processed: 0, flagged: 0, errors: 0 });

  // Track outputs
  const [outputFiles, setOutputFiles] = useState<OutputFile[]>(
    useCase.outputTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      type: t.fileType,
      ready: false,
    }))
  );

  // Build intake items from sources
  const buildIntakeItems = useCallback((): IntakeItem[] => {
    return useCase.sources.map((s) => ({
      id: s.name,
      name: s.name,
      received: sourceStatuses[s.name] === 'complete',
      required: !s.optional,
    }));
  }, [useCase.sources, sourceStatuses]);

  // Handle source activation (simulate fetching data)
  const handleSourceActivate = useCallback((sourceName: string, sourceType: string) => {
    setSourceStatuses((prev) => ({ ...prev, [sourceName]: 'loading' }));

    // Simulate loading delay and generate demo data
    setTimeout(() => {
      const newData: Record<string, unknown> = {};

      if (sourceType === 'outlook') {
        newData.emails = generateDemoEmails();
      } else if (sourceType === 'onedrive') {
        newData.files = generateDemoFiles();
      } else if (sourceType === 'excel') {
        newData.spreadsheet = generateDemoSpreadsheet();
      }

      setSourceData((prev) => ({ ...prev, [sourceName]: newData }));
      setSourceStatuses((prev) => ({ ...prev, [sourceName]: 'complete' }));
    }, 1000 + Math.random() * 1000);
  }, []);

  // Handle processing
  const handleProcess = useCallback(() => {
    setProcessingStatus('processing');
    setProcessingProgress(0);

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

    // Complete processing after delay
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

      // Mark outputs as ready
      setOutputFiles((prev) =>
        prev.map((f) => ({ ...f, ready: true }))
      );

      onProcessComplete?.(stats);
    }, 3000);
  }, [onProcessComplete]);

  // Check if can process
  const canProcess = useCase.sources
    .filter((s) => !s.optional)
    .every((s) => sourceStatuses[s.name] === 'complete');

  // Build nodes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildNodes = useCallback((): Node[] => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodes: Node[] = [];
    const ySpacing = 100;
    const xSpacing = 320;

    // Source nodes (left column)
    useCase.sources.forEach((source, index) => {
      const yOffset = (index - (useCase.sources.length - 1) / 2) * ySpacing;
      const data = sourceData[source.name] || {};

      nodes.push({
        id: `source-${source.name}`,
        type: 'source',
        position: { x: 0, y: 180 + yOffset },
        data: {
          label: source.name,
          type: source.type,
          status: sourceStatuses[source.name],
          optional: source.optional,
          onActivate: () => handleSourceActivate(source.name, source.type),
          emails: data.emails,
          files: data.files,
          spreadsheet: data.spreadsheet,
          capturedImage: data.capturedImage,
        },
      });
    });

    // Intake node (center-left)
    nodes.push({
      id: 'intake',
      type: 'intake',
      position: { x: xSpacing, y: 140 },
      data: {
        label: 'Intake Folder',
        items: buildIntakeItems(),
        canProcess,
        onProcess: handleProcess,
      },
    });

    // Processing node (center)
    nodes.push({
      id: 'processing',
      type: 'processing',
      position: { x: xSpacing * 2, y: 160 },
      data: {
        label: 'AI Processing',
        status: processingStatus,
        progress: processingProgress,
        stats: processingStatus === 'complete' ? processingStats : undefined,
      },
    });

    // Output node (right)
    nodes.push({
      id: 'output',
      type: 'output',
      position: { x: xSpacing * 3, y: 120 },
      data: {
        label: 'Outputs',
        files: outputFiles,
        onPreview: (file: OutputFile) => console.log('Preview:', file),
        onDownload: (file: OutputFile) => console.log('Download:', file),
      },
    });

    return nodes;
  }, [
    useCase.sources,
    sourceStatuses,
    sourceData,
    buildIntakeItems,
    canProcess,
    handleProcess,
    handleSourceActivate,
    processingStatus,
    processingProgress,
    processingStats,
    outputFiles,
  ]);

  // Build edges with gradient animation
  const buildEdges = useCallback((): Edge[] => {
    const edges: Edge[] = [];

    // Edges from sources to intake
    useCase.sources.forEach((source) => {
      const isComplete = sourceStatuses[source.name] === 'complete';
      const isLoading = sourceStatuses[source.name] === 'loading';

      edges.push({
        id: `edge-${source.name}-intake`,
        source: `source-${source.name}`,
        target: 'intake',
        animated: isLoading,
        style: {
          stroke: isComplete ? '#10b981' : isLoading ? '#2596be' : 'rgba(255,255,255,0.2)',
          strokeWidth: isComplete ? 3 : 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isComplete ? '#10b981' : isLoading ? '#2596be' : 'rgba(255,255,255,0.2)',
        },
      });
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
        stroke: isComplete ? '#10b981' : isProcessing ? '#8b5cf6' : 'rgba(255,255,255,0.2)',
        strokeWidth: isComplete || isProcessing ? 3 : 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isComplete ? '#10b981' : isProcessing ? '#8b5cf6' : 'rgba(255,255,255,0.2)',
      },
    });

    // Edge from processing to output
    edges.push({
      id: 'edge-processing-output',
      source: 'processing',
      target: 'output',
      animated: false,
      style: {
        stroke: isComplete ? '#10b981' : 'rgba(255,255,255,0.2)',
        strokeWidth: isComplete ? 3 : 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isComplete ? '#10b981' : 'rgba(255,255,255,0.2)',
      },
    });

    return edges;
  }, [useCase.sources, sourceStatuses, processingStatus]);

  return (
    <div className="w-full h-[600px] canvas-dark-gradient rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      <ReactFlow
        nodes={buildNodes()}
        edges={buildEdges()}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        zoomOnScroll={false}
        panOnScroll={false}
        panOnDrag={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgba(255,255,255,0.05)" gap={24} size={1} />
        <Controls
          showInteractive={false}
          className="!bg-white/10 !border-white/20 !rounded-lg [&>button]:!bg-white/10 [&>button]:!border-white/20 [&>button]:!text-white [&>button:hover]:!bg-white/20"
        />
      </ReactFlow>
    </div>
  );
}
