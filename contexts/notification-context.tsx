"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { listarFuncionariosAPI } from "@/lib/api-service";

// --- TYPES ---

type ToastType = "success" | "error" | "warning" | "info";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  createdAt: number;
  action?: ToastAction;
}

interface Notification {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  createdAt: number;
  read: boolean;
}

interface NotificationContextValue {
  // Toast methods
  success: (title: string, description?: string, action?: ToastAction) => void;
  error: (title: string, description?: string, action?: ToastAction) => void;
  warning: (title: string, description?: string, action?: ToastAction) => void;
  info: (title: string, description?: string, action?: ToastAction) => void;
  notify: (
    type: ToastType,
    title: string,
    description?: string,
    action?: ToastAction,
  ) => void;
  // Notification center
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  addPersistentNotification: (
    type: ToastType,
    title: string,
    description?: string,
  ) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

const TOAST_DURATION = 5000;
const STORAGE_KEY = "trl_notifications";
const GENERATED_KEY = "trl_generated_alerts";

// --- TOAST ITEM COMPONENT ---

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(TOAST_DURATION);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = () => {
      if (isPaused) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const elapsed = Date.now() - startTimeRef.current;
      const remaining = remainingTimeRef.current - elapsed;

      if (remaining <= 0) {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 300);
        return;
      }

      setProgress((remaining / TOAST_DURATION) * 100);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPaused, toast.id, onRemove]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    remainingTimeRef.current = (progress / 100) * TOAST_DURATION;
  };

  const handleMouseLeave = () => {
    startTimeRef.current = Date.now();
    setIsPaused(false);
  };

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const config = {
    success: {
      icon: CheckCircle,
      borderColor: "border-l-green-500",
      iconColor: "text-green-600",
      bgColor: "bg-white dark:bg-gray-900",
      progressColor: "bg-green-500",
    },
    error: {
      icon: AlertCircle,
      borderColor: "border-l-red-500",
      iconColor: "text-red-600",
      bgColor: "bg-white dark:bg-gray-900",
      progressColor: "bg-red-500",
    },
    warning: {
      icon: AlertTriangle,
      borderColor: "border-l-yellow-500",
      iconColor: "text-yellow-600",
      bgColor: "bg-white dark:bg-gray-900",
      progressColor: "bg-yellow-500",
    },
    info: {
      icon: Info,
      borderColor: "border-l-blue-500",
      iconColor: "text-blue-600",
      bgColor: "bg-white dark:bg-gray-900",
      progressColor: "bg-blue-500",
    },
  };

  const {
    icon: Icon,
    borderColor,
    iconColor,
    bgColor,
    progressColor,
  } = config[toast.type];

  return (
    <div
      className={cn(
        "relative w-80 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300",
        "border-l-4",
        borderColor,
        bgColor,
        isExiting
          ? "animate-out fade-out-0 slide-out-to-right-full"
          : "animate-in slide-in-from-right-full fade-in-0",
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-start gap-3 p-4">
        <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", iconColor)} />
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold text-foreground">{toast.title}</p>
          {toast.description && (
            <p className="text-xs text-muted-foreground">{toast.description}</p>
          )}
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                handleClose();
              }}
              className={cn(
                "mt-2 text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                toast.type === "error"
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : toast.type === "warning"
                    ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                    : toast.type === "success"
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200",
              )}
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-1 w-full bg-gray-200 dark:bg-gray-700">
        <div
          className={cn("h-full transition-none", progressColor)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// --- PROVIDER COMPONENT ---

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const hasCheckedRef = useRef(false);

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setNotifications(JSON.parse(stored));
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined" && notifications.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    }
  }, [notifications]);

  // Proactive monitoring - Check driver documents on load
  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const checkDriverDocuments = async () => {
      try {
        const employees = await listarFuncionariosAPI();
        if (!Array.isArray(employees)) return;

        const drivers = employees.filter(
          (e: any) => e.role === "Motorista" || !e.role,
        );
        const today = new Date();
        const thirtyDaysFromNow = new Date(
          today.getTime() + 30 * 24 * 60 * 60 * 1000,
        );

        // Get already generated alert IDs from localStorage
        const generatedAlerts: string[] = JSON.parse(
          localStorage.getItem(GENERATED_KEY) || "[]",
        );
        const newGeneratedAlerts: string[] = [...generatedAlerts];

        for (const driver of drivers) {
          const cnhExpiry = driver.cnh_expiry || driver.cnhExpiry;
          const moppExpiry = driver.mopp_expiry || driver.moppExpiry;
          const driverName = driver.name || "Motorista";

          // Check CNH expiry
          if (cnhExpiry) {
            const expiryDate = new Date(cnhExpiry);
            const alertId = `cnh-${driver.id}-${cnhExpiry}`;

            if (!generatedAlerts.includes(alertId)) {
              if (expiryDate < today) {
                // CNH is expired
                addPersistentNotificationInternal(
                  "error",
                  "CNH Vencida",
                  `A CNH do motorista ${driverName} está vencida desde ${expiryDate.toLocaleDateString("pt-BR")}.`,
                );
                newGeneratedAlerts.push(alertId);
              } else if (expiryDate <= thirtyDaysFromNow) {
                // CNH expires within 30 days
                const daysUntilExpiry = Math.ceil(
                  (expiryDate.getTime() - today.getTime()) /
                    (1000 * 60 * 60 * 24),
                );
                addPersistentNotificationInternal(
                  "warning",
                  "CNH Vencendo",
                  `A CNH do motorista ${driverName} vence em ${daysUntilExpiry} dias.`,
                );
                newGeneratedAlerts.push(alertId);
              }
            }
          }

          // Check MOPP expiry
          if (moppExpiry && driver.mopp) {
            const expiryDate = new Date(moppExpiry);
            const alertId = `mopp-${driver.id}-${moppExpiry}`;

            if (!generatedAlerts.includes(alertId)) {
              if (expiryDate < today) {
                addPersistentNotificationInternal(
                  "error",
                  "MOPP Vencido",
                  `O MOPP do motorista ${driverName} está vencido desde ${expiryDate.toLocaleDateString("pt-BR")}.`,
                );
                newGeneratedAlerts.push(alertId);
              } else if (expiryDate <= thirtyDaysFromNow) {
                const daysUntilExpiry = Math.ceil(
                  (expiryDate.getTime() - today.getTime()) /
                    (1000 * 60 * 60 * 24),
                );
                addPersistentNotificationInternal(
                  "warning",
                  "MOPP Vencendo",
                  `O MOPP do motorista ${driverName} vence em ${daysUntilExpiry} dias.`,
                );
                newGeneratedAlerts.push(alertId);
              }
            }
          }
        }

        // Save new generated alerts
        localStorage.setItem(GENERATED_KEY, JSON.stringify(newGeneratedAlerts));
      } catch (error) {
        console.error("Erro ao verificar documentos dos motoristas:", error);
      }
    };

    // Delay check to allow auth to settle
    const timeoutId = setTimeout(() => {
      checkDriverDocuments();
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (
      type: ToastType,
      title: string,
      description?: string,
      action?: ToastAction,
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setToasts((prev) => [
        ...prev,
        { id, type, title, description, createdAt: Date.now(), action },
      ]);
    },
    [],
  );

  const addPersistentNotificationInternal = useCallback(
    (type: ToastType, title: string, description?: string) => {
      const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setNotifications((prev) => [
        { id, type, title, description, createdAt: Date.now(), read: false },
        ...prev,
      ]);
    },
    [],
  );

  const addPersistentNotification = useCallback(
    (type: ToastType, title: string, description?: string) => {
      addPersistentNotificationInternal(type, title, description);
    },
    [addPersistentNotificationInternal],
  );

  const notify = useCallback(
    (
      type: ToastType,
      title: string,
      description?: string,
      action?: ToastAction,
    ) => {
      addToast(type, title, description, action);
    },
    [addToast],
  );

  const success = useCallback(
    (title: string, description?: string, action?: ToastAction) =>
      addToast("success", title, description, action),
    [addToast],
  );

  const error = useCallback(
    (title: string, description?: string, action?: ToastAction) =>
      addToast("error", title, description, action),
    [addToast],
  );

  const warning = useCallback(
    (title: string, description?: string, action?: ToastAction) =>
      addToast("warning", title, description, action),
    [addToast],
  );

  const info = useCallback(
    (title: string, description?: string, action?: ToastAction) =>
      addToast("info", title, description, action),
    [addToast],
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        success,
        error,
        warning,
        info,
        notify,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        addPersistentNotification,
      }}
    >
      {children}
      {/* Toast container - fixed position top-right */}
      <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

// --- HOOKS ---

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
}

// Backwards compatibility alias
export function useToastNotification() {
  return useNotification();
}
