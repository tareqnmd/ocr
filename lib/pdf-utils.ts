import { NextResponse } from 'next/server';
import { fromBuffer } from 'pdf2pic';
import { getDocument } from 'pdfjs-serverless';

interface PDFTextExtractionResult {
	text: string;
	wordCount: number;
	charCount: number;
	pageCount: number;
}

interface PDFImageConversionResult {
	images: Array<{ pageNumber: number; imageData: string }>;
	pageCount: number;
}

export async function extractTextFromPDF(
	arrayBuffer: ArrayBuffer
): Promise<PDFTextExtractionResult> {
	const uint8Array = new Uint8Array(arrayBuffer);

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

	return {
		text: fullText,
		wordCount,
		charCount: fullText.length,
		pageCount: pdfDocument.numPages,
	};
}

export async function convertPDFToImages(
	arrayBuffer: ArrayBuffer
): Promise<PDFImageConversionResult> {
	const uint8Array = new Uint8Array(arrayBuffer);
	const pdfBuffer = Buffer.from(arrayBuffer);

	const loadingTask = getDocument({
		data: uint8Array,
		useSystemFonts: true,
	});

	const pdfDocument = await loadingTask.promise;

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

	return {
		images,
		pageCount: pdfDocument.numPages,
	};
}

export async function processPDF(file: File): Promise<NextResponse> {
	try {
		const arrayBuffer = await file.arrayBuffer();

		// Try to extract text first
		const extractionResult = await extractTextFromPDF(arrayBuffer);

		// If no text was found, convert to images for client-side OCR
		if (!extractionResult.text.trim()) {
			try {
				const conversionResult = await convertPDFToImages(arrayBuffer);

				return NextResponse.json({
					requiresClientOCR: true,
					isScannedPDF: true,
					fileName: file.name,
					fileType: file.type,
					pageCount: conversionResult.pageCount,
					images: conversionResult.images,
					message: 'Scanned PDF converted to images for OCR processing',
				});
			} catch (conversionError) {
				return NextResponse.json({
					text: 'This PDF appears to contain scanned images or no extractable text. Please convert to images and upload for OCR processing.',
					fileName: file.name,
					fileType: file.type,
					pageCount: extractionResult.pageCount,
					processingMethod: 'PDF text extraction (no text found)',
					wordCount: 0,
					charCount: 0,
					confidence: 0,
				});
			}
		}

		// Return successful text extraction result
		return NextResponse.json({
			text: extractionResult.text,
			fileName: file.name,
			fileType: file.type,
			pageCount: extractionResult.pageCount,
			processingMethod: 'pdfjs-serverless text extraction',
			wordCount: extractionResult.wordCount,
			charCount: extractionResult.charCount,
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
}
