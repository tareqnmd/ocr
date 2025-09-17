export interface ValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
}

export function validateFile(file: File): ValidationResult {
  const maxSize = 50 * 1024 * 1024 // 50MB
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

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds the maximum limit of 50MB`,
    }
  }

  // Check file type
  if (!supportedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Unsupported file type: ${file.type}. Please upload PDF, PNG, JPG, JPEG, GIF, BMP, TIFF, or WebP files.`,
    }
  }

  // Check for empty files
  if (file.size === 0) {
    return {
      isValid: false,
      error: "File appears to be empty. Please select a valid file.",
    }
  }

  const warnings: string[] = []

  // Add warnings for potentially problematic files
  if (file.size < 1024) {
    warnings.push("File is very small and may not contain readable content")
  }

  if (file.type === "image/gif") {
    warnings.push("GIF files may not produce optimal OCR results")
  }

  if (file.size > 10 * 1024 * 1024) {
    warnings.push("Large files may take longer to process")
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

export function validateBatch(files: File[]): ValidationResult {
  const maxBatchSize = 10
  const maxTotalSize = 100 * 1024 * 1024 // 100MB total

  if (files.length === 0) {
    return {
      isValid: false,
      error: "No files selected",
    }
  }

  if (files.length > maxBatchSize) {
    return {
      isValid: false,
      error: `Too many files selected. Maximum ${maxBatchSize} files allowed per batch.`,
    }
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  if (totalSize > maxTotalSize) {
    return {
      isValid: false,
      error: `Total file size (${formatFileSize(totalSize)}) exceeds the maximum limit of 100MB`,
    }
  }

  // Validate each file
  for (const file of files) {
    const fileValidation = validateFile(file)
    if (!fileValidation.isValid) {
      return {
        isValid: false,
        error: `${file.name}: ${fileValidation.error}`,
      }
    }
  }

  const warnings: string[] = []
  if (files.length > 5) {
    warnings.push("Processing many files may take several minutes")
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
