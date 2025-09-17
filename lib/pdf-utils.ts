export interface PDFInfo {
  pageCount: number
  hasSelectableText: boolean
  fileSize: number
  title?: string
  author?: string
  creationDate?: Date
}

export async function analyzePDF(buffer: Buffer): Promise<PDFInfo> {
  try {
    const pdf = await import("pdf-parse")
    const data = await pdf.default(buffer)

    return {
      pageCount: data.numpages,
      hasSelectableText: data.text.trim().length > 50,
      fileSize: buffer.length,
      title: data.info?.Title,
      author: data.info?.Author,
      creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
    }
  } catch (error) {
    console.error("PDF analysis error:", error)
    throw new Error("Failed to analyze PDF")
  }
}

export function generatePDFProcessingAdvice(pdfInfo: PDFInfo): string {
  if (pdfInfo.hasSelectableText) {
    return "This PDF contains selectable text and can be processed directly."
  }

  const advice = [
    "This PDF appears to contain scanned images or non-selectable text.",
    "",
    "For best OCR results, consider:",
    "• Converting PDF pages to high-resolution images (300 DPI recommended)",
    "• Using PNG or JPEG format for individual pages",
    "• Ensuring images are clear and well-lit",
    "",
    `Document info:`,
    `• Pages: ${pdfInfo.pageCount}`,
    `• Size: ${formatBytes(pdfInfo.fileSize)}`,
  ]

  if (pdfInfo.title) advice.push(`• Title: ${pdfInfo.title}`)
  if (pdfInfo.author) advice.push(`• Author: ${pdfInfo.author}`)

  return advice.join("\n")
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
