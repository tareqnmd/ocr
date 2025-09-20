import { NextResponse } from 'next/server';

export function createErrorResponse(
	message: string,
	details?: string,
	status = 500
): NextResponse {
	return NextResponse.json(
		{
			error: message,
			...(details && { details }),
		},
		{ status }
	);
}

export function handleServerError(error: unknown): NextResponse {
	console.error('[OCR API] Server error:', error);

	return NextResponse.json(
		{
			error:
				'An unexpected error occurred while processing your file. Please try again.',
		},
		{ status: 500 }
	);
}
