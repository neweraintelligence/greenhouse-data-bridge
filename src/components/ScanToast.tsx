import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, X, ScanBarcode } from 'lucide-react';

export interface ScanNotification {
  id: string;
  type: 'success' | 'warning' | 'error';
  shipmentId: string;
  scannedBy: string;
  message?: string;
  timestamp: number;
}

interface ScanToastProps {
  notifications: ScanNotification[];
  onDismiss: (id: string) => void;
}

export function ScanToast({ notifications, onDismiss }: ScanToastProps) {
  return (
    <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-2 pointer-events-none">
      {notifications.map((notification) => (
        <ToastItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  notification: ScanNotification;
  onDismiss: (id: string) => void;
}

function ToastItem({ notification, onDismiss }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setIsVisible(true));

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onDismiss(notification.id), 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const handleDismiss = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => onDismiss(notification.id), 300);
  }, [notification.id, onDismiss]);

  const bgColor = notification.type === 'success'
    ? 'bg-emerald-600'
    : notification.type === 'warning'
    ? 'bg-amber-500'
    : 'bg-red-500';

  const Icon = notification.type === 'success'
    ? CheckCircle2
    : notification.type === 'warning'
    ? AlertTriangle
    : AlertTriangle;

  return (
    <div
      className={`
        pointer-events-auto
        flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl
        ${bgColor} text-white
        transform transition-all duration-300 ease-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        min-w-[320px] max-w-[400px]
      `}
    >
      <div className="flex-shrink-0 mt-0.5">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <ScanBarcode className="w-4 h-4 opacity-80" />
          <span className="font-semibold text-sm">{notification.shipmentId}</span>
        </div>
        <p className="text-sm opacity-90 mt-0.5">
          {notification.message || (notification.type === 'success' ? 'Scan completed' : 'Scan issue')}
        </p>
        <p className="text-xs opacity-75 mt-1">
          by <span className="font-medium">{notification.scannedBy}</span>
        </p>
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Hook to manage notifications
export function useScanNotifications() {
  const [notifications, setNotifications] = useState<ScanNotification[]>([]);

  const addNotification = useCallback((
    type: 'success' | 'warning' | 'error',
    shipmentId: string,
    scannedBy: string,
    message?: string
  ) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setNotifications((prev) => [
      ...prev,
      { id, type, shipmentId, scannedBy, message, timestamp: Date.now() },
    ]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    notifications,
    addNotification,
    dismissNotification,
  };
}
