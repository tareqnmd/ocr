import { createWorker } from 'tesseract.js';

export interface OCRResult {
	text: string;
	confidence: number;
	processingTime: number;
}

export async function performClientOCR(
	file: File,
	onProgress?: (progress: number) => void
): Promise<OCRResult> {
	const startTime = Date.now();

	const worker = await createWorker('eng', 1, {
		logger: (m) => {
			if (onProgress && m.progress) {
				onProgress(m.progress);
			}
		},
	});

	try {
		await worker.setParameters({
			tesseract_pageseg_mode: '1',
			tesseract_ocr_engine_mode: '2',
		});

		const {
			data: { text, confidence },
		} = await worker.recognize(file);

		const processingTime = Date.now() - startTime;

		return {
			text: cleanOCRText(text),
			confidence,
			processingTime,
		};
	} finally {
		await worker.terminate();
	}
}

function cleanOCRText(text: string): string {
	return text
		.replace(/\s+/g, ' ')
		.replace(/\n\s*\n\s*\n/g, '\n\n')
		.replace(/[^\S\n]+/g, ' ')
		.trim();
}

export function validateImageFile(file: File): {
	valid: boolean;
	error?: string;
} {
	const supportedTypes = [
		'image/jpeg',
		'image/jpg',
		'image/png',
		'image/gif',
		'image/bmp',
		'image/tiff',
		'image/webp',
	];

	if (!supportedTypes.includes(file.type)) {
		return {
			valid: false,
			error: `Unsupported file type: ${file.type}. Supported formats: PNG, JPG, JPEG, GIF, BMP, TIFF, WebP`,
		};
	}

	const maxSize = 50 * 1024 * 1024; // 50MB
	if (file.size > maxSize) {
		return {
			valid: false,
			error: `File size (${formatFileSize(
				file.size
			)}) exceeds the maximum limit of 50MB`,
		};
	}

	if (file.size === 0) {
		return {
			valid: false,
			error: 'File appears to be empty. Please select a valid file.',
		};
	}

	return { valid: true };
}

function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return (
		Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	);
}
