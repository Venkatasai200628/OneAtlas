"use client";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useState, useEffect, createContext, useContext, useCallback } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2);
    const duration = toast.duration ?? 4000;
    setToasts((prev) => [...prev, { ...toast, id }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const success = useCallback((title: string, description?: string) =>
    addToast({ type: "success", title, description }), [addToast]);
  const error = useCallback((title: string, description?: string) =>
    addToast({ type: "error", title, description, duration: 6000 }), [addToast]);
  const warning = useCallback((title: string, description?: string) =>
    addToast({ type: "warning", title, description }), [addToast]);
  const info = useCallback((title: string, description?: string) =>
    addToast({ type: "info", title, description }), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const icons = {
    success: <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />,
    error: <XCircle className="w-4 h-4 text-red-600 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-600 shrink-0" />,
  };

  const styles = {
    success: "border-green-200 bg-white",
    error: "border-red-200 bg-white",
    warning: "border-yellow-200 bg-white",
    info: "border-blue-200 bg-white",
  };

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-[16px] border shadow-[0_4px_24px_rgba(0,0,0,0.08)] animate-fade-in",
      styles[toast.type]
    )}>
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#111111]">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-[#6B7280] mt-0.5">{toast.description}</p>
        )}
      </div>
      <button onClick={onRemove} className="text-[#9CA3AF] hover:text-[#111111] transition-colors shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
