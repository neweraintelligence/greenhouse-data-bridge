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

import { SourceNode, IntakeNode, ProcessingNode, OutputNode } from './nodes';
import type { IntakeItem } from './nodes/IntakeNode';
import type { OutputFile } from './nodes/OutputNode';
import type { UseCase } from '../../lib/useCases/types';

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

export function FlowCanvas({ useCase, onProcessComplete }: FlowCanvasProps) {
  // Track source statuses
  const [sourceStatuses, setSourceStatuses] = useState<Record<string, 'pending' | 'loading' | 'complete'>>(
    Object.fromEntries(useCase.sources.map((s) => [s.name, 'pending']))
  );

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
  const handleSourceActivate = useCallback((sourceName: string) => {
    setSourceStatuses((prev) => ({ ...prev, [sourceName]: 'loading' }));

    // Simulate loading delay
    setTimeout(() => {
      setSourceStatuses((prev) => ({ ...prev, [sourceName]: 'complete' }));
    }, 1000 + Math.random() * 1500);
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
    const ySpacing = 80;
    const xSpacing = 250;

    // Source nodes (left column)
    useCase.sources.forEach((source, index) => {
      const yOffset = (index - (useCase.sources.length - 1) / 2) * ySpacing;
      nodes.push({
        id: `source-${source.name}`,
        type: 'source',
        position: { x: 0, y: 150 + yOffset },
        data: {
          label: source.name,
          type: source.type,
          status: sourceStatuses[source.name],
          optional: source.optional,
          onActivate: () => handleSourceActivate(source.name),
        },
      });
    });

    // Intake node (center-left)
    nodes.push({
      id: 'intake',
      type: 'intake',
      position: { x: xSpacing, y: 120 },
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
      position: { x: xSpacing * 2, y: 140 },
      data: {
        label: 'Processing',
        status: processingStatus,
        progress: processingProgress,
        stats: processingStatus === 'complete' ? processingStats : undefined,
      },
    });

    // Output node (right)
    nodes.push({
      id: 'output',
      type: 'output',
      position: { x: xSpacing * 3, y: 100 },
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
    buildIntakeItems,
    canProcess,
    handleProcess,
    handleSourceActivate,
    processingStatus,
    processingProgress,
    processingStats,
    outputFiles,
  ]);

  // Build edges
  const buildEdges = useCallback((): Edge[] => {
    const edges: Edge[] = [];

    // Edges from sources to intake
    useCase.sources.forEach((source) => {
      edges.push({
        id: `edge-${source.name}-intake`,
        source: `source-${source.name}`,
        target: 'intake',
        animated: sourceStatuses[source.name] === 'loading',
        style: {
          stroke: sourceStatuses[source.name] === 'complete' ? '#10b981' : '#d1d5db',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: sourceStatuses[source.name] === 'complete' ? '#10b981' : '#d1d5db',
        },
      });
    });

    // Edge from intake to processing
    edges.push({
      id: 'edge-intake-processing',
      source: 'intake',
      target: 'processing',
      animated: processingStatus === 'processing',
      style: {
        stroke: processingStatus === 'complete' ? '#10b981' : '#d1d5db',
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: processingStatus === 'complete' ? '#10b981' : '#d1d5db',
      },
    });

    // Edge from processing to output
    edges.push({
      id: 'edge-processing-output',
      source: 'processing',
      target: 'output',
      animated: false,
      style: {
        stroke: processingStatus === 'complete' ? '#10b981' : '#d1d5db',
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: processingStatus === 'complete' ? '#10b981' : '#d1d5db',
      },
    });

    return edges;
  }, [useCase.sources, sourceStatuses, processingStatus]);

  return (
    <div className="w-full h-[500px] bg-gray-50 rounded-xl border border-gray-200">
      <ReactFlow
        nodes={buildNodes()}
        edges={buildEdges()}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={false}
        nodesConnectable={false}
        zoomOnScroll={false}
        panOnScroll={false}
        panOnDrag={false}
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
