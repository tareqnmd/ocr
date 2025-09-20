export interface OCRResult {
	text: string;
	confidence?: number;
	fileName: string;
	fileType: string;
	processingTime?: number;
}

export interface ProcessingStatus {
	status: 'idle' | 'processing' | 'completed' | 'error';
	progress?: number;
	message?: string;
}

export function cleanExtractedText(text: string): string {
	return text
		.replace(/\s+/g, ' ')
		.replace(/\n\s*\n/g, '\n\n')
		.trim();
}

export function validateFileType(file: File): boolean {
	const supportedTypes = [
		'application/pdf',
		'image/jpeg',
		'image/jpg',
		'image/png',
		'image/gif',
		'image/bmp',
		'image/tiff',
	];

	return supportedTypes.includes(file.type);
}

export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return (
		Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	);
}

export function estimateProcessingTime(file: File): number {
	const baseTime = file.type === 'application/pdf' ? 3000 : 2000; // ms
	const sizeMultiplier = Math.max(1, file.size / (1024 * 1024)); // MB
	return Math.round(baseTime * sizeMultiplier);
}
