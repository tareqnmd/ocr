import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ImageIcon, CheckCircle, AlertCircle } from "lucide-react"

interface ResultsSummaryProps {
  totalFiles: number
  completedFiles: number
  errorFiles: number
  totalWords: number
  totalCharacters: number
  pdfFiles: number
  imageFiles: number
}

export function ResultsSummary({
  totalFiles,
  completedFiles,
  errorFiles,
  totalWords,
  totalCharacters,
  pdfFiles,
  imageFiles,
}: ResultsSummaryProps) {
  const successRate = totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Processing Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{completedFiles}</div>
            <div className="text-sm text-muted-foreground">Files Processed</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{successRate}%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{totalWords.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Words Extracted</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{totalCharacters.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Characters</div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-red-500" />
            <span>
              {pdfFiles} PDF{pdfFiles !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-500" />
            <span>
              {imageFiles} Image{imageFiles !== 1 ? "s" : ""}
            </span>
          </div>
          {errorFiles > 0 && (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span>
                {errorFiles} Error{errorFiles !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
