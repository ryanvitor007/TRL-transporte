"use client"

import React, { createContext, useContext, useState, useCallback, useRef } from "react"
import { CheckCircle, AlertCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastType = "success" | "error"

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  createdAt: number
}

interface ToastContextValue {
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TOAST_DURATION = 4000

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(100)
  const startTimeRef = useRef(Date.now())
  const remainingTimeRef = useRef(TOAST_DURATION)
  const animationFrameRef = useRef<number>()

  React.useEffect(() => {
    const animate = () => {
      if (isPaused) {
        animationFrameRef.current = requestAnimationFrame(animate)
        return
      }

      const elapsed = Date.now() - startTimeRef.current
      const remaining = remainingTimeRef.current - elapsed

      if (remaining <= 0) {
        onRemove(toast.id)
        return
      }

      setProgress((remaining / TOAST_DURATION) * 100)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPaused, toast.id, onRemove])

  const handleMouseEnter = () => {
    setIsPaused(true)
    remainingTimeRef.current = (progress / 100) * TOAST_DURATION
  }

  const handleMouseLeave = () => {
    startTimeRef.current = Date.now()
    setIsPaused(false)
  }

  const isSuccess = toast.type === "success"

  return (
    <div
      className={cn(
        "relative w-80 overflow-hidden rounded-lg border shadow-lg transition-all duration-300 animate-in slide-in-from-right-full",
        isSuccess
          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
          : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-start gap-3 p-4">
        {isSuccess ? (
          <CheckCircle className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
        ) : (
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
        )}
        <div className="flex-1 space-y-1">
          <p
            className={cn(
              "text-sm font-semibold",
              isSuccess ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200",
            )}
          >
            {toast.title}
          </p>
          {toast.description && (
            <p
              className={cn(
                "text-xs",
                isSuccess ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300",
              )}
            >
              {toast.description}
            </p>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className={cn(
            "shrink-0 rounded p-1 transition-colors",
            isSuccess
              ? "text-green-600 hover:bg-green-200 dark:text-green-400 dark:hover:bg-green-800"
              : "text-red-600 hover:bg-red-200 dark:text-red-400 dark:hover:bg-red-800",
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-1 w-full bg-black/10 dark:bg-white/10">
        <div
          className={cn("h-full transition-none", isSuccess ? "bg-green-500" : "bg-red-500")}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((type: ToastType, title: string, description?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setToasts((prev) => [...prev, { id, type, title, description, createdAt: Date.now() }])
  }, [])

  const success = useCallback(
    (title: string, description?: string) => addToast("success", title, description),
    [addToast],
  )

  const error = useCallback((title: string, description?: string) => addToast("error", title, description), [addToast])

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}
      {/* Toast container - fixed position top-right */}
      <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToastNotification() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToastNotification must be used within a ToastProvider")
  }
  return context
}
