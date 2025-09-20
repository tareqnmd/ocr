import { processImage } from '@/lib/image-utils';
import { processPDF } from '@/lib/pdf-utils';
import { handleServerError } from '@/lib/response-utils';
import { validateFile, validateFormData } from '@/lib/validation';
import { type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const { formData, response: formDataError } = await validateFormData(
			request
		);
		if (formDataError) return formDataError;

		const file = formData?.get('file') as File;
		const { isValid, response: fileValidationError } = validateFile(file);
		if (!isValid) return fileValidationError;

		if (file.type === 'application/pdf') {
			return processPDF(file);
		} else {
			return processImage(file);
		}
	} catch (error) {
		return handleServerError(error);
	}
}
