export interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  extractedText?: string;
  error?: string;
  pageCount?: number;
  processingMethod?: string;
  wordCount?: number;
  charCount?: number;
  confidence?: number;
  processingTime?: number;
  progress?: number;
}
