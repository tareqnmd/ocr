import { NextResponse } from 'next/server';
import { formatFileSize } from './ocr-utils';

export const MAX_FILE_SIZE = 50 * 1024 * 1024;

export const SUPPORTED_FILE_TYPES = [
	'application/pdf',
	'image/jpeg',
	'image/jpg',
	'image/png',
	'image/gif',
	'image/bmp',
	'image/tiff',
	'image/webp',
];

export interface ValidationResult {
	isValid: boolean;
	response?: NextResponse;
}

export async function validateFormData(
	request: Request
): Promise<{ formData?: FormData; response?: NextResponse }> {
	try {
		const formData = await request.formData();
		return { formData };
	} catch (error) {
		return {
			response: NextResponse.json(
				{
					error:
						"Invalid request format. Please ensure you're uploading files properly.",
					details:
						'The request must be sent as multipart/form-data with a file field.',
				},
				{ status: 400 }
			),
		};
	}
}

export function validateFile(file: File | null): ValidationResult {
	if (!file) {
		return {
			isValid: false,
			response: NextResponse.json(
				{ error: 'No file provided' },
				{ status: 400 }
			),
		};
	}

	if (file.size > MAX_FILE_SIZE) {
		return {
			isValid: false,
			response: NextResponse.json(
				{
					error: `File size (${formatFileSize(
						file.size
					)}) exceeds the maximum limit of 50MB`,
				},
				{ status: 413 }
			),
		};
	}

	if (file.size === 0) {
		return {
			isValid: false,
			response: NextResponse.json(
				{ error: 'File appears to be empty. Please select a valid file.' },
				{ status: 400 }
			),
		};
	}

	if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
		return {
			isValid: false,
			response: NextResponse.json(
				{
					error: `Unsupported file type: ${file.type}. Supported formats: PDF, PNG, JPG, JPEG, GIF, BMP, TIFF, WebP`,
				},
				{ status: 400 }
			),
		};
	}

	return { isValid: true };
}
