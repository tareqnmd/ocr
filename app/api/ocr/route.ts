import { type NextRequest, NextResponse } from "next/server"
import { getDocument } from "pdfjs-serverless"
import { fromBuffer } from "pdf2pic"

export async function POST(request: NextRequest) {
  console.log("[v0] PDF processing API called")

  try {
    const contentType = request.headers.get("content-type")
    console.log("[v0] Content type:", contentType)

    let formData
    try {
      console.log("[v0] Parsing form data")
      formData = await request.formData()
      console.log("[v0] Form data parsed successfully")
    } catch (error) {
      console.error("[v0] FormData parsing error:", error)
      return NextResponse.json(
        {
          error: "Invalid request format. Please ensure you're uploading files properly.",
          details: "The request must be sent as multipart/form-data with a file field.",
        },
        { status: 400 },
      )
    }

    const file = formData.get("file") as File
    console.log("[v0] File received:", file?.name, file?.type, file?.size)

    if (!file) {
      console.log("[v0] No file provided")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size (${formatFileSize(file.size)}) exceeds the maximum limit of 50MB` },
        { status: 413 },
      )
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "File appears to be empty. Please select a valid file." }, { status: 400 })
    }

    // Validate file type
    const supportedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/bmp",
      "image/tiff",
      "image/webp",
    ]

    if (!supportedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Supported formats: PDF, PNG, JPG, JPEG, GIF, BMP, TIFF, WebP` },
        { status: 400 },
      )
    }

    if (file.type === "application/pdf") {
      console.log("[v0] Processing PDF file")
      try {
        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer.slice()) // Copy for PDF.js
        const pdfBuffer = Buffer.from(arrayBuffer.slice()) // Copy for pdf2pic
        console.log("[v0] Loading PDF with pdfjs-serverless")

        const loadingTask = getDocument({
          data: uint8Array,
          useSystemFonts: true,
        })

        const pdfDocument = await loadingTask.promise
        console.log("[v0] PDF loaded successfully, pages:", pdfDocument.numPages)

        let fullText = ""

        // Extract text from all pages
        for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
          console.log(`[v0] Processing page ${pageNum}`)
          const page = await pdfDocument.getPage(pageNum)
          const textContent = await page.getTextContent()

          // Combine text items with proper spacing
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(" ")
            .replace(/\s+/g, " ") // Normalize whitespace
            .trim()

          if (pageText) {
            fullText += (fullText ? "\n\n" : "") + `--- Page ${pageNum} ---\n${pageText}`
          }
        }

        console.log("[v0] Text extracted successfully, length:", fullText.length)

        const wordCount = fullText.trim()
          ? fullText
              .trim()
              .split(/\s+/)
              .filter((word) => word.length > 0).length
          : 0

        if (!fullText.trim()) {
          console.log("[v0] No text found, converting PDF to images for OCR")

          try {
            const convert = fromBuffer(pdfBuffer, {
              density: 200, // DPI for better OCR quality
              saveFilename: "page",
              savePath: "./",
              format: "png",
              width: 2000, // High resolution for better OCR
              height: 2000,
            })

            const images = []
            for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
              console.log(`[v0] Converting page ${pageNum} to image`)
              const result = await convert(pageNum, { responseType: "buffer" })

              // Convert buffer to base64 for client-side processing
              const base64Image = `data:image/png;base64,${result.buffer.toString("base64")}`
              images.push({
                pageNumber: pageNum,
                imageData: base64Image,
              })
            }

            console.log(`[v0] Successfully converted ${images.length} pages to images`)

            return NextResponse.json({
              requiresClientOCR: true,
              isScannedPDF: true,
              fileName: file.name,
              fileType: file.type,
              pageCount: pdfDocument.numPages,
              images: images,
              message: "Scanned PDF converted to images for OCR processing",
            })
          } catch (conversionError) {
            console.error("[v0] PDF to image conversion failed:", conversionError)
            return NextResponse.json({
              text: "This PDF appears to contain scanned images or no extractable text. Please convert to images and upload for OCR processing.",
              fileName: file.name,
              fileType: file.type,
              pageCount: pdfDocument.numPages,
              processingMethod: "PDF text extraction (no text found)",
              wordCount: 0,
              charCount: 0,
              confidence: 0,
            })
          }
        }

        return NextResponse.json({
          text: fullText,
          fileName: file.name,
          fileType: file.type,
          pageCount: pdfDocument.numPages,
          processingMethod: "pdfjs-serverless text extraction",
          wordCount,
          charCount: fullText.length,
          confidence: 95, // High confidence for native PDF text
        })
      } catch (error) {
        console.error("[v0] PDF processing error:", error)
        return NextResponse.json(
          {
            error:
              "Failed to process PDF. This might be a scanned PDF - please try converting to images for OCR processing.",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 400 },
        )
      }
    } else {
      return NextResponse.json({
        requiresClientOCR: true,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        message: "Image ready for OCR processing",
      })
    }
  } catch (error) {
    console.error("[v0] API processing error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your file. Please try again." },
      { status: 500 },
    )
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
