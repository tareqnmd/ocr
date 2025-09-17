import { FileText } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
            <FileText className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-card-foreground">OCR Text Extractor</h1>
            <p className="text-sm text-muted-foreground">Professional document processing</p>
          </div>
        </div>
      </div>
    </header>
  )
}
