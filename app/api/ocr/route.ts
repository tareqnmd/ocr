import { type NextRequest, NextResponse } from 'next/server';
import { fromBuffer } from 'pdf2pic';
import { getDocument } from 'pdfjs-serverless';

export async function POST(request: NextRequest) {
	try {
		let formData;
		try {
			formData = await request.formData();
		} catch (error) {
			return NextResponse.json(
				{
					error:
						"Invalid request format. Please ensure you're uploading files properly.",
					details:
						'The request must be sent as multipart/form-data with a file field.',
				},
				{ status: 400 }
			);
		}

		const file = formData.get('file') as File;

		if (!file) {
			return NextResponse.json({ error: 'No file provided' }, { status: 400 });
		}

		const maxSize = 50 * 1024 * 1024;
		if (file.size > maxSize) {
			return NextResponse.json(
				{
					error: `File size (${formatFileSize(
						file.size
					)}) exceeds the maximum limit of 50MB`,
				},
				{ status: 413 }
			);
		}

		if (file.size === 0) {
			return NextResponse.json(
				{ error: 'File appears to be empty. Please select a valid file.' },
				{ status: 400 }
			);
		}

		const supportedTypes = [
			'application/pdf',
			'image/jpeg',
			'image/jpg',
			'image/png',
			'image/gif',
			'image/bmp',
			'image/tiff',
			'image/webp',
		];

		if (!supportedTypes.includes(file.type)) {
			return NextResponse.json(
				{
					error: `Unsupported file type: ${file.type}. Supported formats: PDF, PNG, JPG, JPEG, GIF, BMP, TIFF, WebP`,
				},
				{ status: 400 }
			);
		}

		if (file.type === 'application/pdf') {
			try {
				const arrayBuffer = await file.arrayBuffer();
				const uint8Array = new Uint8Array(arrayBuffer.slice());
				const pdfBuffer = Buffer.from(arrayBuffer.slice());

				const loadingTask = getDocument({
					data: uint8Array,
					useSystemFonts: true,
				});

				const pdfDocument = await loadingTask.promise;

				let fullText = '';

				for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
					const page = await pdfDocument.getPage(pageNum);
					const textContent = await page.getTextContent();

					const pageText = textContent.items
						.map((item: any) => item.str)
						.join(' ')
						.replace(/\s+/g, ' ')
						.trim();

					if (pageText) {
						fullText +=
							(fullText ? '\n\n' : '') + `--- Page ${pageNum} ---\n${pageText}`;
					}
				}

				const wordCount = fullText.trim()
					? fullText
							.trim()
							.split(/\s+/)
							.filter((word) => word.length > 0).length
					: 0;

				if (!fullText.trim()) {
					try {
						const convert = fromBuffer(pdfBuffer, {
							density: 200,
							saveFilename: 'page',
							savePath: './',
							format: 'png',
							width: 2000,
							height: 2000,
						});

						const images = [];
						for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
							const result = await convert(pageNum, { responseType: 'buffer' });
							const base64Image = `data:image/png;base64,${
								result && result.buffer ? result.buffer.toString('base64') : ''
							}`;
							images.push({
								pageNumber: pageNum,
								imageData: base64Image,
							});
						}

						return NextResponse.json({
							requiresClientOCR: true,
							isScannedPDF: true,
							fileName: file.name,
							fileType: file.type,
							pageCount: pdfDocument.numPages,
							images: images,
							message: 'Scanned PDF converted to images for OCR processing',
						});
					} catch (conversionError) {
						return NextResponse.json({
							text: 'This PDF appears to contain scanned images or no extractable text. Please convert to images and upload for OCR processing.',
							fileName: file.name,
							fileType: file.type,
							pageCount: pdfDocument.numPages,
							processingMethod: 'PDF text extraction (no text found)',
							wordCount: 0,
							charCount: 0,
							confidence: 0,
						});
					}
				}

				return NextResponse.json({
					text: fullText,
					fileName: file.name,
					fileType: file.type,
					pageCount: pdfDocument.numPages,
					processingMethod: 'pdfjs-serverless text extraction',
					wordCount,
					charCount: fullText.length,
					confidence: 95,
				});
			} catch (error) {
				console.error('PDF processing error:', error);
				return NextResponse.json(
					{
						error:
							'Failed to process PDF. This might be a scanned PDF - please try converting to images for OCR processing.',
						details: error instanceof Error ? error.message : 'Unknown error',
					},
					{ status: 400 }
				);
			}
		} else {
			return NextResponse.json({
				requiresClientOCR: true,
				fileName: file.name,
				fileType: file.type,
				fileSize: file.size,
				message: 'Image ready for OCR processing',
			});
		}
	} catch (error) {
		console.error('[v0] API processing error:', error);
		return NextResponse.json(
			{
				error:
					'An unexpected error occurred while processing your file. Please try again.',
			},
			{ status: 500 }
		);
	}
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
