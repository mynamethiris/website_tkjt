import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  id?: string;
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  id,
  message,
  type,
  onClose,
  duration = 2000,
}: ToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    const intervalTime = 20;
    const steps = duration / intervalTime;
    const decrement = 100 / steps;

    const progressTimer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - decrement));
    }, intervalTime);

    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, [duration, onClose]);

  return (
    <div
      id={id}
      className="pointer-events-auto fixed top-24 left-4 right-4 sm:left-auto sm:right-4 w-auto sm:w-full sm:max-w-sm z-[9999] flex overflow-hidden rounded-xl border border-gray-100 bg-white/95 shadow-xl backdrop-blur-md transition-all duration-300 dark:border-slate-800 dark:bg-slate-900/95 animate-in slide-in-from-right-10"
    >
      <div className="flex w-full flex-col">
        <div className="flex items-start p-4">
          <div className="flex-shrink-0">
            {type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-in zoom-in duration-300" />
            ) : type === 'error' ? (
              <AlertCircle className="h-5 w-5 text-rose-500 animate-in zoom-in duration-300" />
            ) : (
              <AlertCircle className="h-5 w-5 text-blue-500 animate-in zoom-in duration-300" />
            )}
          </div>
          <div className="ml-3 flex-1 pt-0.5">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {type === 'success' ? 'Sukses' : type === 'error' ? 'Kesalahan' : 'Informasi'}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {message}
            </p>
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex rounded-lg text-gray-400 hover:text-gray-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="h-1 bg-slate-100 dark:bg-slate-800 w-full">
          <div
            className={`h-full transition-all duration-75 ${
              type === 'success'
                ? 'bg-emerald-500'
                : type === 'error'
                  ? 'bg-rose-500'
                  : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
