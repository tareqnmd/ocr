import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Info, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PDFInfoCardProps {
  fileName: string
  pageCount: number
  hasSelectableText: boolean
  processingMethod: string
}

export function PDFInfoCard({ fileName, pageCount, hasSelectableText, processingMethod }: PDFInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-red-500" />
          PDF Analysis: {fileName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-foreground">Pages:</span>
            <span className="ml-2 text-muted-foreground">{pageCount}</span>
          </div>
          <div>
            <span className="font-medium text-foreground">Processing:</span>
            <span className="ml-2 text-muted-foreground">{processingMethod}</span>
          </div>
        </div>

        {!hasSelectableText && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This PDF contains scanned images or non-selectable text. For full OCR processing:
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>Convert PDF pages to individual images (PNG/JPG)</li>
                <li>Upload images separately for OCR processing</li>
                <li>Use high resolution (300 DPI) for best results</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {hasSelectableText && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>This PDF contains selectable text that has been successfully extracted.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
