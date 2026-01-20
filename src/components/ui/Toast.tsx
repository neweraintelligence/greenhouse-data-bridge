import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, onClose, duration = 4000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setIsVisible(true));

    // Start fade out before removal
    const fadeTimer = setTimeout(() => {
      setIsLeaving(true);
    }, duration - 400);

    // Remove after fade completes
    const removeTimer = setTimeout(onClose, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [duration, onClose]);

  return (
    <div
      className={`
        fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]
        transition-all duration-400 ease-out
        ${isVisible && !isLeaving ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
    >
      <div className="bg-neutral-900 text-white px-5 py-3 rounded-xl shadow-xl">
        <span className="text-sm font-medium tracking-wide">{message}</span>
      </div>
    </div>
  );
}
