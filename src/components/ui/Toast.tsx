import { useEffect } from 'react';
import { Check, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }[type];

  const Icon = type === 'success' ? Check : type === 'error' ? AlertCircle : AlertCircle;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-300">
      <div className={`${bgColor} text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md backdrop-blur-xl`}>
        <Icon className="w-5 h-5 shrink-0" />
        <span className="flex-1 font-medium text-sm">{message}</span>
        <button
          onClick={onClose}
          className="hover:bg-white/20 rounded-full p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
