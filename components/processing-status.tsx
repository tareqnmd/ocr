import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

interface ProcessingStatusProps {
  fileName: string
  status: "processing" | "completed" | "error"
  progress?: number
  error?: string
}

export function ProcessingStatus({ fileName, status, progress = 0, error }: ProcessingStatusProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {status === "processing" && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
          {status === "completed" && <CheckCircle className="w-5 h-5 text-green-600" />}
          {status === "error" && <AlertCircle className="w-5 h-5 text-destructive" />}

          <div className="flex-1">
            <p className="font-medium text-foreground">{fileName}</p>
            {status === "processing" && (
              <div className="mt-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-1">Processing... {Math.round(progress)}%</p>
              </div>
            )}
            {status === "completed" && <p className="text-sm text-green-600">Text extraction completed</p>}
            {status === "error" && <p className="text-sm text-destructive">{error || "Processing failed"}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
