import { NextResponse } from 'next/server';

export async function processImage(file: File): Promise<NextResponse> {
	return NextResponse.json({
		requiresClientOCR: true,
		fileName: file.name,
		fileType: file.type,
		fileSize: file.size,
		message: 'Image ready for OCR processing',
	});
}
