import { memo, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info, User } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'user-joined';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

function ToastComponent({ id, type, message, duration = 4000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'user-joined': return <User className="w-5 h-5 text-bmf-blue" />;
      default: return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success': return 'bg-emerald-50 border-emerald-300 text-emerald-900';
      case 'error': return 'bg-red-50 border-red-300 text-red-900';
      case 'user-joined': return 'bg-blue-50 border-bmf-blue text-gray-900';
      default: return 'bg-blue-50 border-blue-300 text-blue-900';
    }
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 shadow-lg backdrop-blur-sm animate-in slide-in-from-right duration-300 ${getStyles()}`}>
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

// Toast Container
interface ToastContainerProps {
  toasts: Array<{id: string; type: ToastType; message: string}>;
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-20 right-6 z-[10002] space-y-3 max-w-md">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}
