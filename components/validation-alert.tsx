"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Info } from "lucide-react"

interface ValidationAlertProps {
  type: "error" | "warning"
  message: string
  onDismiss?: () => void
}

export function ValidationAlert({ type, message, onDismiss }: ValidationAlertProps) {
  return (
    <Alert variant={type === "error" ? "destructive" : "default"} className="mb-4">
      {type === "error" ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onDismiss && (
          <button onClick={onDismiss} className="ml-2 text-sm underline hover:no-underline">
            Dismiss
          </button>
        )}
      </AlertDescription>
    </Alert>
  )
}
