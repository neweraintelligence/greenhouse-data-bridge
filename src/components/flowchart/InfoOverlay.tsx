import { memo, useEffect, useState, useRef } from 'react';
import { X, Warehouse, Truck, Maximize2, Minimize2, Zap, ChevronLeft, ChevronRight, Mail, FolderOpen, FileSpreadsheet, Camera, ScanBarcode, RefreshCw, Inbox, Cog, ClipboardList, AlertOctagon, Send, FileText, UserPlus, Trophy, DoorOpen, Database } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ChallengeLeaderboard } from '../challenges/ChallengeLeaderboard';
import { ReconciliationDataView } from '../reconciliation/ReconciliationDataView';

// Helper function to map node labels to Supabase source table names
// Uses both node label AND use case context to determine correct routing
function getSourceTypeFromNode(nodeLabel: string, useCase?: string): string {
  const label = nodeLabel.toLowerCase();
  const useCaseLower = useCase?.toLowerCase() || '';

  // ==========================================
  // USE CASE SPECIFIC ROUTING (check first)
  // ==========================================

  // INCIDENTS USE CASE
  if (useCaseLower === 'incidents') {
    // Output node -> incident dashboard/report view
    if (label.includes('dashboard') || label.includes('output') || label.includes('results') || label.includes('reports')) {
      return 'incident_dashboard';
    }
    // Review queue for ambiguous incidents
    if (label.includes('review queue') || label.includes('human review') || label.includes('review')) {
      return 'incident_review';
    }
    // Escalation / Communications / ETL / Processing -> informational only (no participant action)
    if (label.includes('escalation') || label.includes('router') ||
        label.includes('communication') || label.includes('email') ||
        label.includes('etl') || label.includes('normalization') ||
        label.includes('data engine') || label.includes('processing') || label.includes('ai vision') ||
        label.includes('business rules') || label.includes('raci')) {
      return 'incident_info'; // Informational slide - no participant action
    }
    // Only Incident Report Form and Intake Folder -> photo reporter for submitting incidents
    if (label.includes('incident report') || label.includes('intake') || label.includes('queue')) {
      return 'incidents';
    }
    // Default fallback for incidents - informational
    return 'incident_info';
  }

  // TRAINING USE CASE
  if (useCaseLower === 'training') {
    // Output node -> training compliance report (only actual output node)
    if (label.includes('output') || label.includes('results')) {
      return 'training_compliance';
    }
    // Processing/check node -> training quiz
    if (label.includes('check') || label.includes('processing')) {
      return 'training_quiz';
    }
    // Everything else in training -> training roster
    return 'training_roster';
  }

  // SHIPPING USE CASE (or default)
  if (useCaseLower === 'shipping' || useCaseLower === 'receiving' || useCaseLower === '' || !useCase) {
    // Output node -> reconciliation report view (only actual output node)
    if (label.includes('output') || label.includes('results')) {
      return 'reconciliation_report';
    }
    // Review queue - human-in-the-loop for AI-flagged discrepancies
    if (label.includes('review queue') || label.includes('human review') || label.includes('exception') || label.includes('needs review')) {
      return 'review_queue';
    }
    // Reconciliation quiz - accuracy challenge on merged/normalized data
    if (label.includes('data engine') || label.includes('reconciled data') || label.includes('reconciliation engine') ||
        label.includes('comparing') || label.includes('merged') || label.includes('normalized') || label.includes('combined data')) {
      return 'reconciliation_quiz';
    }
    // Barcode scanning
    if (label.includes('scan') || label.includes('barcode') || label.includes('dock verification')) {
      return 'barcode_scans';
    }
    // Invoice PDF / OneDrive -> billing challenge (invoice verification)
    if (label.includes('invoice') || label.includes('billing') || label.includes('onedrive')) {
      return 'billing_challenge';
    }
    // BOL notification email -> communications (not shipments_expected)
    if (label.includes('bill of lading') || label.includes('bol') || label.includes('lading')) {
      return 'communications';
    }
    // Communications / follow-up
    if (label.includes('email') || label.includes('outlook') || label.includes('communication') || label.includes('follow-up')) {
      return 'communications';
    }
    // Expected Shipments (Excel) - first slide
    if (label.includes('expected') || label.includes('shipment') || label.includes('excel') || label.includes('order')) {
      return 'shipments_expected';
    }
    // Default for shipping - but this shouldn't happen now
    return 'shipments_expected';
  }

  // ==========================================
  // GENERIC LABEL-BASED ROUTING (fallback)
  // ==========================================

  // Incident-specific keywords (if useCase wasn't specified but label indicates incidents)
  if (label.includes('incident') || label.includes('raci') || label.includes('ai vision') ||
      label.includes('severity') || label.includes('maintenance')) {
    return 'incidents';
  }

  if (label.includes('shipment') || label.includes('expected')) return 'shipments_expected';
  if (label.includes('training') || label.includes('roster') || label.includes('acknowledgement')) return 'training_roster';
  if (label.includes('customer') || label.includes('order')) return 'customer_orders';
  if (label.includes('quality')) return 'quality_issues';
  if (label.includes('email') || label.includes('outlook') || label.includes('mail') || label.includes('communication')) return 'communications';
  if (label.includes('scan') || label.includes('barcode')) return 'barcode_scans';
  if (label.includes('billing') || label.includes('invoice') || label.includes('document')) return 'billing_challenge';

  // Ultimate fallback
  return 'shipments_expected';
}

// Match the header colors from all node types
const headerColors = {
  outlook: {
    bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
    glow: 'shadow-[0_4px_20px_rgba(59,130,246,0.3)]',
  },
  onedrive: {
    bg: 'bg-gradient-to-r from-sky-500 to-blue-500',
    glow: 'shadow-[0_4px_20px_rgba(14,165,233,0.3)]',
  },
  excel: {
    bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
    glow: 'shadow-[0_4px_20px_rgba(34,197,94,0.3)]',
  },
  paper: {
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    glow: 'shadow-[0_4px_20px_rgba(245,158,11,0.3)]',
  },
  barcode: {
    bg: 'bg-gradient-to-r from-violet-500 to-purple-600',
    glow: 'shadow-[0_4px_20px_rgba(139,92,246,0.3)]',
  },
  etl: {
    bg: 'bg-gradient-to-r from-purple-500 to-violet-600',
    glow: 'shadow-[0_4px_20px_rgba(139,92,246,0.3)]',
  },
  intake: {
    bg: 'bg-gradient-to-r from-sky-500 to-blue-500',
    glow: 'shadow-[0_4px_20px_rgba(14,165,233,0.3)]',
  },
  processing: {
    bg: 'bg-gradient-to-r from-indigo-500 to-purple-600',
    glow: 'shadow-[0_4px_20px_rgba(99,102,241,0.3)]',
  },
  reviewQueue: {
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    glow: 'shadow-[0_4px_20px_rgba(245,158,11,0.3)]',
  },
  escalation: {
    bg: 'bg-gradient-to-r from-red-500 to-orange-600',
    glow: 'shadow-[0_4px_20px_rgba(239,68,68,0.3)]',
  },
  communications: {
    bg: 'bg-gradient-to-r from-blue-500 to-cyan-600',
    glow: 'shadow-[0_4px_20px_rgba(59,130,246,0.3)]',
  },
  output: {
    bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
    glow: 'shadow-[0_4px_20px_rgba(16,185,129,0.3)]',
  },
};

const iconMap = {
  outlook: Mail,
  onedrive: FolderOpen,
  excel: FileSpreadsheet,
  paper: Camera,
  barcode: ScanBarcode,
  etl: RefreshCw,
  intake: Inbox,
  processing: Cog,
  reviewQueue: ClipboardList,
  escalation: AlertOctagon,
  communications: Send,
  output: FileText,
};

export type FlowDirection = 'inbound' | 'outbound' | 'both';

export interface NodeInfo {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  painPoint: string;
  solution: string;
  keyInsight?: string;
  icon?: React.ReactNode;
  // Layout preference - randomize text/image sides
  imageOnLeft?: boolean;
  // Directional content - if present, allows toggling between perspectives
  flowContext?: {
    inbound?: {
      label: string;
      description?: string;
      painPoint?: string;
      solution?: string;
      keyInsight?: string;
    };
    outbound?: {
      label: string;
      description?: string;
      painPoint?: string;
      solution?: string;
      keyInsight?: string;
    };
  };
}

interface InfoOverlayProps {
  info: NodeInfo | null;
  onClose: () => void;
  // Node preview content - pass the actual node component to display
  nodePreviewContent?: React.ReactNode;
  // Trigger data fetch for the node
  onFetchData?: () => void;
  // Check if data can be fetched
  canFetch?: boolean;
  // Navigation between slides
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  // Image to display in visual area
  imageUrl?: string | null;
  // Node type and label for preview card styling
  nodeType?: string;
  nodeLabel?: string;
  // Trigger full modal (same as flowchart mode)
  onMaximize?: () => void;
  // Session code for QR code generation
  sessionCode?: string;
  // Use case for proper QR code routing
  useCase?: string;
}

function InfoOverlayComponent({
  info,
  onClose,
  nodePreviewContent,
  onFetchData,
  canFetch,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  imageUrl,
  nodeType,
  nodeLabel,
  onMaximize,
  sessionCode,
  useCase,
}: InfoOverlayProps) {


  // Track which direction perspective is active - default to inbound (receiving)
  const [activeDirection, setActiveDirection] = useState<FlowDirection>('inbound');

  // Track whether to show the node preview overlay
  const [showNodePreview, setShowNodePreview] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  // Start preview card more centered
  const [previewPosition, setPreviewPosition] = useState({ x: window.innerWidth * 0.55, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Track "peek through" mode - hold spacebar to see flowchart behind
  const [isPeeking, setIsPeeking] = useState(false);

  // Track QR code hover
  const [showJoinQR, setShowJoinQR] = useState(false);

  // Track leaderboard visibility
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Track reconciliation data view visibility
  const [showReconciliationData, setShowReconciliationData] = useState(false);

  // Check if this is a billing challenge slide
  const isBillingSlide = nodeLabel && getSourceTypeFromNode(nodeLabel, useCase) === 'billing_challenge';

  // Check if this is a reconciliation quiz slide (processing node = Data Engine)
  // Also check nodeType directly for robustness
  const isReconciliationSlide = nodeType === 'processing' || (nodeLabel && getSourceTypeFromNode(nodeLabel, useCase) === 'reconciliation_quiz');


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && hasNext && onNext) {
        e.preventDefault();
        onNext();
      } else if (e.key === 'ArrowLeft' && hasPrevious && onPrevious) {
        e.preventDefault();
        onPrevious();
      } else if (e.key === ' ' && !isPeeking) {
        // Spacebar - start peeking (hold to see flowchart)
        e.preventDefault();
        setIsPeeking(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' && isPeeking) {
        // Release spacebar - return to slide
        e.preventDefault();
        setIsPeeking(false);
      }
    };

    if (info) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
      };
    }
  }, [info, onClose, onNext, onPrevious, hasNext, hasPrevious, isPeeking]);

  // Reset state when slide changes - using nodeLabel and imageUrl as more reliable triggers
  useEffect(() => {
    setActiveDirection('inbound');
    setShowNodePreview(false);
    setPreviewExpanded(false);
  }, [nodeLabel, imageUrl]);

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection
    e.stopPropagation(); // Prevent closing the overlay
    setIsDragging(true);
    setHasDragged(false); // Reset drag flag
    dragStartPos.current = {
      x: e.clientX - previewPosition.x,
      y: e.clientY - previewPosition.y,
    };
  };

  // Handle dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setHasDragged(true); // Mark that we've actually moved
      setPreviewPosition({
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Clear the drag flag after a short delay
      setTimeout(() => setHasDragged(false), 100);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!info) return null;

  // Get header colors and icon for preview card based on node type (with fallback)
  const nodeColors = nodeType && headerColors[nodeType as keyof typeof headerColors]
    ? headerColors[nodeType as keyof typeof headerColors]
    : { bg: 'bg-gradient-to-r from-gray-500 to-gray-600', glow: 'shadow-[0_4px_20px_rgba(107,114,128,0.3)]' };
  const NodeIcon = nodeType && iconMap[nodeType as keyof typeof iconMap]
    ? iconMap[nodeType as keyof typeof iconMap]
    : FileText;

  // Determine what content to show based on active direction
  const hasDirectionalContent = info.flowContext?.inbound || info.flowContext?.outbound;

  // Get the active content based on direction
  const getActiveContent = (field: 'description' | 'painPoint' | 'solution' | 'keyInsight') => {
    if (activeDirection === 'inbound' && info.flowContext?.inbound?.[field]) {
      return info.flowContext.inbound[field];
    }
    if (activeDirection === 'outbound' && info.flowContext?.outbound?.[field]) {
      return info.flowContext.outbound[field];
    }
    return info[field];
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center animate-in fade-in duration-700"
      onClick={() => {
        // Don't close if we're dragging or just finished dragging
        if (isDragging || hasDragged) return;
        onClose();
      }}
    >
      {/* Light beige backdrop with grain texture - horizontal gradient when peeking */}
      <div
        className="absolute inset-0 backdrop-blur-lg transition-all duration-700 ease-out"
        style={{
          backgroundColor: 'rgba(245, 242, 237, 0.85)',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
          maskImage: isPeeking
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 10%, transparent 90%, rgba(0,0,0,0.3) 100%)'
            : 'none',
          WebkitMaskImage: isPeeking
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 10%, transparent 90%, rgba(0,0,0,0.3) 100%)'
            : 'none',
          backdropFilter: isPeeking ? 'blur(2px)' : 'blur(16px)',
        }}
      />

      {/* Dismiss button - top left (gracefully fade when peeking) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-8 left-8 z-[10000] w-12 h-12 rounded-full bg-gray-800/10 hover:bg-gray-800/20 transition-all duration-700 ease-out flex items-center justify-center"
        style={{
          opacity: isPeeking ? 0 : 1,
          transform: isPeeking ? 'scale(0.8)' : 'scale(1)',
        }}
        title="Close (Esc)"
      >
        <X className="w-5 h-5 text-gray-800/70" />
      </button>

      {/* Action buttons - top right */}
      {nodeLabel && (
        <div
          className="absolute top-8 right-8 z-[10000] flex items-center gap-3 transition-all duration-700 ease-out"
          style={{
            opacity: isPeeking ? 0 : 1,
            transform: isPeeking ? 'scale(0.8)' : 'scale(1)',
          }}
        >
          {/* Reconciliation Data button - for processing/Data Engine node */}
          {isReconciliationSlide && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowReconciliationData(!showReconciliationData);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium shadow-lg transition-all ${
                showReconciliationData
                  ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
              }`}
            >
              <Database className="w-4 h-4" />
              <span className="text-sm">View Data</span>
            </button>
          )}

          {/* Leaderboard button - only for billing challenges */}
          {isBillingSlide && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLeaderboard(!showLeaderboard);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium shadow-lg transition-all ${
                showLeaderboard
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span className="text-sm">Leaderboard</span>
            </button>
          )}

          {/* Join button - requires sessionCode for QR code */}
          {sessionCode && (
            <div
              onMouseEnter={() => setShowJoinQR(true)}
              onMouseLeave={() => setShowJoinQR(false)}
            >
              <button
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-bmf-blue hover:bg-bmf-blue-dark text-white font-medium shadow-lg transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span className="text-sm">Join</span>
              </button>

              {/* QR Code Tooltip */}
              {showJoinQR && (
                <div className="absolute top-full right-0 mt-3 p-4 bg-white rounded-2xl shadow-2xl border border-gray-200 animate-in fade-in duration-200">
                  <div className="flex flex-col items-center gap-2">
                    <QRCodeSVG
                      value={`${window.location.origin}/mobile-entry/${sessionCode}?source=${getSourceTypeFromNode(nodeLabel, useCase)}&node=${encodeURIComponent(nodeLabel)}&useCase=${useCase || ''}`}
                      size={180}
                      level="M"
                      includeMargin
                      className="rounded-lg"
                    />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-900">Scan to Participate</p>
                      <p className="text-xs text-gray-500 mt-1">Use your phone camera</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Peek through hint - bottom center, subtle */}
      {!isPeeking && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[10000] animate-in fade-in duration-500 delay-1000">
          <div className="px-3 py-1.5 rounded-lg bg-gray-800/30 backdrop-blur-sm text-white/40 text-xs flex items-center gap-1.5" style={{ fontFamily: 'var(--font-body)' }}>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">SPACE</kbd>
            <span className="text-[10px]">peek</span>
          </div>
        </div>
      )}

      {/* Previous slide button - left edge (hide when peeking) */}
      {hasPrevious && onPrevious && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          className="absolute left-8 top-1/2 -translate-y-1/2 z-[10000] w-14 h-14 rounded-full bg-gray-800/10 hover:bg-gray-800/20 transition-all flex items-center justify-center"
          style={{ opacity: isPeeking ? 0 : 1 }}
          title="Previous (←)"
        >
          <ChevronLeft className="w-6 h-6 text-gray-800/70" />
        </button>
      )}

      {/* Next slide button - right edge (hide when peeking) */}
      {hasNext && onNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-8 top-1/2 -translate-y-1/2 z-[10000] w-14 h-14 rounded-full bg-gray-800/10 hover:bg-gray-800/20 transition-all flex items-center justify-center"
          style={{ opacity: isPeeking ? 0 : 1 }}
          title="Next (→)"
        >
          <ChevronRight className="w-6 h-6 text-gray-800/70" />
        </button>
      )}

      {/* Two-column layout - conditionally flipped, nearly invisible when peeking */}
      <div
        className={`relative z-10 w-full h-full flex transition-all duration-700 ease-out ${
          info.imageOnLeft ? 'flex-row-reverse' : ''
        }`}
        style={{
          opacity: isPeeking ? 0 : 1,
          transform: isPeeking ? 'scale(0.95)' : 'scale(1)',
          pointerEvents: isPeeking ? 'none' : 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Text column (aligned with padding for X button) */}
        <div className={`w-2/3 pr-12 pt-32 pb-16 flex flex-col justify-center overflow-y-auto ${
          info.imageOnLeft ? 'pr-24 pl-12' : 'pl-24'
        }`}>
          {/* Subtitle with mode badge - compact */}
          <div className="flex items-center gap-2 mb-4">
            <p
              className="text-sm tracking-[0.15em] uppercase text-gray-500"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {info.subtitle}
            </p>
            {hasDirectionalContent && activeDirection !== 'both' && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeDirection === 'inbound'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {activeDirection === 'inbound' ? 'RECEIVING' : 'SHIPPING'}
              </span>
            )}
          </div>

          {/* Title - fit screen */}
          <h1
            className="text-5xl font-semibold text-gray-900 tracking-tight mb-6 leading-[1.1]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {info.title}
          </h1>

          {/* Description - fit screen */}
          <p
            className="text-lg text-gray-700 leading-relaxed mb-8"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 300 }}
          >
            {getActiveContent('description')}
          </p>

          {/* Pain point - fit screen */}
          <div className="mb-6">
            <p
              className="text-xs tracking-[0.12em] uppercase text-amber-600 mb-2"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              The Problem
            </p>
            <p
              className="text-xl text-gray-800 leading-snug font-light"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              "{getActiveContent('painPoint')}"
            </p>
          </div>

          {/* Solution - fit screen */}
          <div className="mb-6">
            <p
              className="text-xs tracking-[0.12em] uppercase text-emerald-600 mb-2"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              The Solution
            </p>
            <p
              className="text-xl text-gray-800 leading-snug font-light"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              "{getActiveContent('solution')}"
            </p>
          </div>

          {/* Key insight - fit screen */}
          {getActiveContent('keyInsight') && (
            <div className="border-l-2 border-gray-300 pl-4 mb-6">
              <p
                className="text-base text-gray-600 italic"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 300 }}
              >
                {getActiveContent('keyInsight')}
              </p>
            </div>
          )}

          {/* Direction toggle switch */}
          {hasDirectionalContent && info.flowContext?.inbound && info.flowContext?.outbound && (
            <div className="flex flex-col items-center gap-4 mt-auto pt-8 border-t border-gray-300">
              <p className="text-xs tracking-[0.2em] uppercase text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>
                Toggle Perspective
              </p>

              <div className="flex items-center gap-4">
                {/* Receiving */}
                <div className="flex items-center gap-2">
                  <Warehouse className={`w-5 h-5 transition-colors ${activeDirection === 'inbound' ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <span
                    className={`text-sm font-medium transition-colors ${activeDirection === 'inbound' ? 'text-emerald-700' : 'text-gray-500'}`}
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    Receiving
                  </span>
                </div>

                {/* Toggle switch */}
                <button
                  onClick={() => {
                    const newDirection = activeDirection === 'inbound' ? 'outbound' : 'inbound';
                    setActiveDirection(newDirection);
                  }}
                  className="relative w-16 h-8 rounded-full transition-colors"
                  style={{
                    backgroundColor: activeDirection === 'inbound' ? '#10b981' : '#2596be',
                  }}
                >
                  <div
                    className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300"
                    style={{
                      transform: activeDirection === 'inbound' ? 'translateX(4px)' : 'translateX(36px)',
                    }}
                  />
                </button>

                {/* Shipping */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium transition-colors ${activeDirection === 'outbound' ? 'text-blue-700' : 'text-gray-500'}`}
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    Shipping
                  </span>
                  <Truck className={`w-5 h-5 transition-colors ${activeDirection === 'outbound' ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
              </div>

              <p className="text-sm text-gray-500 italic text-center" style={{ fontFamily: 'var(--font-body)', fontWeight: 300 }}>
                {activeDirection === 'inbound' ? info.flowContext.inbound.label : info.flowContext.outbound.label}
              </p>
            </div>
          )}
        </div>

        {/* Vertical divider - elegant gradient */}
        <div className="w-px bg-gradient-to-b from-transparent via-gray-300/60 to-transparent my-16" />

        {/* Image area column */}
        <div className="w-1/3 relative flex flex-col">
          {/* Image display - full height */}
          <div className="absolute inset-0 overflow-hidden">
            {imageUrl ? (
              <img
                key={imageUrl}
                src={imageUrl}
                alt="Visual representation"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Hide broken images
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-center text-gray-300">
                <p className="text-sm" style={{ fontFamily: 'var(--font-body)', fontWeight: 300 }}>
                  Visual Area
                </p>
              </div>
            )}
          </div>

          {/* "Step Into" button - centered in image area */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            {!showNodePreview && nodePreviewContent && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNodePreview(true);
                }}
                className="group relative"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {/* Glassmorphism container */}
                <div className="relative p-7 rounded-3xl bg-white/20 backdrop-blur-xl border border-white/40 shadow-2xl hover:bg-white/30 hover:scale-105 transition-all duration-300 ease-out">
                  {/* Inner glow effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-50" />

                  {/* Content */}
                  <div className="relative flex flex-col items-center gap-2">
                    {/* Door icon from lucide-react */}
                    <DoorOpen className="w-8 h-8 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />

                    {/* Text */}
                    <span className="text-white text-sm font-medium tracking-wide drop-shadow-md">
                      Step Inside
                    </span>
                  </div>
                </div>

                {/* Ambient shadow */}
                <div className="absolute inset-0 rounded-3xl bg-black/20 blur-xl -z-10 group-hover:bg-black/30 transition-all duration-300" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard panel - slides in from right when shown */}
      {showLeaderboard && isBillingSlide && sessionCode && (
        <div
          className="absolute top-24 right-8 z-[10002] w-[500px] animate-in slide-in-from-right duration-300"
          onClick={(e) => e.stopPropagation()}
          style={{
            opacity: isPeeking ? 0 : 1,
          }}
        >
          <ChallengeLeaderboard sessionCode={sessionCode} />
        </div>
      )}

      {/* Reconciliation Data panel - large view for the accuracy quiz */}
      {showReconciliationData && isReconciliationSlide && (
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 z-[10002] w-[90vw] max-w-[1200px] animate-in fade-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
          style={{
            opacity: isPeeking ? 0 : 1,
          }}
        >
          <div className="bg-white/98 backdrop-blur-lg rounded-2xl shadow-2xl p-6 max-h-[80vh] overflow-y-auto">
            <ReconciliationDataView sessionCode={sessionCode || ''} />
          </div>
        </div>
      )}

      {/* Draggable preview card - appears on top when shown (completely hide when peeking) */}
      {showNodePreview && nodePreviewContent && (
        <div
          className={`absolute z-[10001] transition-all duration-700 ease-out`}
          style={{
            left: `${previewPosition.x}px`,
            top: `${previewPosition.y}px`,
            width: previewExpanded ? '600px' : '320px',
            maxHeight: previewExpanded ? '80vh' : '500px',
            opacity: isPeeking ? 0 : 1,
            pointerEvents: isPeeking ? 'none' : 'auto',
          }}
        >
          {/* Match source node styling exactly */}
          <div
            className="min-w-[220px] max-w-[600px] relative rounded-2xl bg-white border border-gray-200/50 shadow-2xl overflow-visible"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Draggable header - matches source node colors */}
            <div
              className={`px-4 py-2.5 ${nodeColors.bg} cursor-grab active:cursor-grabbing rounded-t-2xl flex items-center justify-between select-none`}
              onMouseDown={handleDragStart}
              style={{ userSelect: 'none' }}
            >
              <div className="flex items-center gap-2.5">
                <NodeIcon className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">{nodeLabel || 'Live Preview'}</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {/* Fetch button - compact, only if data can be fetched */}
                {canFetch && onFetchData && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFetchData();
                    }}
                    className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
                    title="Fetch Data"
                  >
                    <Zap className="w-3.5 h-3.5 text-white" />
                  </button>
                )}
                {/* Expand/collapse button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onMaximize) {
                      // Trigger full modal (same as flowchart mode)
                      onMaximize();
                    } else {
                      // Fallback: just expand card
                      setPreviewExpanded(!previewExpanded);
                    }
                  }}
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
                  title={onMaximize ? 'Open Full View' : (previewExpanded ? 'Minimize' : 'Maximize')}
                >
                  {previewExpanded && !onMaximize ? (
                    <Minimize2 className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNodePreview(false);
                    setPreviewExpanded(false);
                  }}
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>

            {/* Content area - matches source node styling, fully interactive */}
            <div className="p-3 bg-white rounded-b-2xl">
              <div
                className="node-content-inset p-3 rounded-xl overflow-auto"
                style={{ maxHeight: previewExpanded ? 'calc(80vh - 80px)' : '450px' }}
              >
                {nodePreviewContent}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export const InfoOverlay = memo(InfoOverlayComponent);
