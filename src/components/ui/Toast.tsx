import { useEffect } from 'react';

interface ToastProps {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ type, message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`fixed right-4 top-4 z-50 rounded-md px-4 py-2 text-sm font-medium text-white shadow-lg ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
      }`}
    >
      {message}
    </div>
  );
} 