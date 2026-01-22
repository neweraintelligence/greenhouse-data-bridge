import { memo, useEffect, useState } from 'react';
import { X, CheckCircle, AlertTriangle, Info, User, Trophy, Camera, FileText, Scan, Zap } from 'lucide-react';

// Extended toast types for context-aware notifications
export type ToastType =
  | 'success'
  | 'error'
  | 'info'
  | 'user-joined'
  | 'challenge-joined'    // Someone joined a challenge
  | 'challenge-completed' // Someone completed a challenge
  | 'incident-submitted'  // Someone submitted an incident
  | 'data-submitted'      // Someone submitted data
  | 'scan-completed'      // Barcode scanned
  | 'receipt-signed';     // Receipt signed

// Context-aware emoji mapping
const typeEmojis: Record<ToastType, string> = {
  'success': '✅',
  'error': '❌',
  'info': 'ℹ️',
  'user-joined': '👋',
  'challenge-joined': '🎯',
  'challenge-completed': '🏆',
  'incident-submitted': '📸',
  'data-submitted': '📊',
  'scan-completed': '📦',
  'receipt-signed': '✍️',
};

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
  showEmoji?: boolean;
}

function ToastComponent({ id, type, message, duration = 6000, onClose, showEmoji = true }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Start exit animation before actually removing
    const exitTimer = setTimeout(() => setIsExiting(true), duration - 300);
    const removeTimer = setTimeout(() => onClose(id), duration);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'user-joined': return <User className="w-5 h-5 text-bmf-blue" />;
      case 'challenge-joined': return <Trophy className="w-5 h-5 text-amber-500" />;
      case 'challenge-completed': return <Trophy className="w-5 h-5 text-amber-500" />;
      case 'incident-submitted': return <Camera className="w-5 h-5 text-orange-500" />;
      case 'data-submitted': return <FileText className="w-5 h-5 text-indigo-500" />;
      case 'scan-completed': return <Scan className="w-5 h-5 text-violet-500" />;
      case 'receipt-signed': return <Zap className="w-5 h-5 text-emerald-500" />;
      default: return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success': return 'bg-emerald-50 border-emerald-300 text-emerald-900';
      case 'error': return 'bg-red-50 border-red-300 text-red-900';
      case 'user-joined': return 'bg-blue-50 border-bmf-blue text-gray-900';
      case 'challenge-joined': return 'bg-amber-50 border-amber-300 text-amber-900';
      case 'challenge-completed': return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-400 text-amber-900';
      case 'incident-submitted': return 'bg-orange-50 border-orange-300 text-orange-900';
      case 'data-submitted': return 'bg-indigo-50 border-indigo-300 text-indigo-900';
      case 'scan-completed': return 'bg-violet-50 border-violet-300 text-violet-900';
      case 'receipt-signed': return 'bg-emerald-50 border-emerald-300 text-emerald-900';
      default: return 'bg-blue-50 border-blue-300 text-blue-900';
    }
  };

  // Celebration animation for completed challenges
  const isCelebration = type === 'challenge-completed';

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border-2 shadow-lg backdrop-blur-sm
        transition-all duration-300
        ${getStyles()}
        ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
        ${isCelebration ? 'animate-bounce-subtle' : 'animate-in slide-in-from-right'}
      `}
    >
      {showEmoji && (
        <span className="text-lg" role="img" aria-label={type}>
          {typeEmojis[type]}
        </span>
      )}
      {getIcon()}
      <p className="flex-1 text-sm font-medium" style={{ fontFamily: 'var(--font-body)' }}>
        {message}
      </p>
      <button
        onClick={() => onClose(id)}
        className="p-1 rounded hover:bg-black/5 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export const Toast = memo(ToastComponent);

// Toast Container - supports stacking up to 5 toasts
interface ToastContainerProps {
  toasts: Array<{id: string; type: ToastType; message: string; duration?: number}>;
  onClose: (id: string) => void;
  maxVisible?: number;
}

export function ToastContainer({ toasts, onClose, maxVisible = 5 }: ToastContainerProps) {
  // Only show most recent toasts, older ones stack behind
  const visibleToasts = toasts.slice(0, maxVisible);

  return (
    <div className="fixed top-20 right-6 z-[10002] space-y-2 max-w-md">
      {visibleToasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            // Subtle stacking effect - newer toasts appear on top
            zIndex: maxVisible - index,
            transform: index > 0 ? `scale(${1 - index * 0.02})` : 'none',
          }}
        >
          <Toast {...toast} onClose={onClose} />
        </div>
      ))}
      {toasts.length > maxVisible && (
        <div className="text-xs text-gray-500 text-right pr-2">
          +{toasts.length - maxVisible} more
        </div>
      )}
    </div>
  );
}

// Helper function to generate context-aware toast messages
export function createContextToast(
  type: ToastType,
  participantName: string,
  context?: string
): { type: ToastType; message: string } {
  switch (type) {
    case 'user-joined':
      return {
        type,
        message: `${typeEmojis['user-joined']} ${participantName} joined the session!`,
      };
    case 'challenge-joined':
      return {
        type,
        message: `${participantName} entered the ${context || 'challenge'}!`,
      };
    case 'challenge-completed':
      return {
        type,
        message: `${participantName} completed the ${context || 'challenge'}!`,
      };
    case 'incident-submitted':
      return {
        type,
        message: `${participantName} reported a${context ? ` ${context}` : 'n'} incident`,
      };
    case 'data-submitted':
      return {
        type,
        message: `${participantName} submitted ${context || 'data'}`,
      };
    case 'scan-completed':
      return {
        type,
        message: `${participantName} scanned ${context || 'a barcode'}`,
      };
    case 'receipt-signed':
      return {
        type,
        message: `${participantName} signed ${context || 'the receipt'}`,
      };
    default:
      return { type, message: participantName };
  }
}

// CSS for subtle bounce animation (add to global styles or use inline)
// .animate-bounce-subtle { animation: bounce-subtle 0.5s ease-out; }
// @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
