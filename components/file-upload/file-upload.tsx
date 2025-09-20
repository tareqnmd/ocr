'use client';

import { PDFInfoCard } from '@/components/file-upload/pdf-info-card';
import { ProcessingStatus } from '@/components/file-upload/processing-status';
import { TextResult } from '@/components/file-upload/text-result';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	performClientOCR,
	validateImageFile,
	type OCRResult,
} from '@/lib/client-ocr';
import { cn } from '@/lib/utils';
import { AlertCircle, FileText, ImageIcon, Upload } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadedFile {
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

export function FileUpload() {
	const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
	const [isProcessing, setIsProcessing] = useState(false);

	const onDrop = useCallback((acceptedFiles: File[]) => {
		const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
			file,
			id: Math.random().toString(36).substr(2, 9),
			status: 'pending',
		}));

		setUploadedFiles((prev) => [...prev, ...newFiles]);
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			'application/pdf': ['.pdf'],
			'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'],
		},
		multiple: true,
	});

	const processBase64ImageOCR = async (
		base64Data: string,
		fileName: string,
		onProgress?: (progress: number) => void
	): Promise<OCRResult> => {
		const response = await fetch(base64Data);
		const blob = await response.blob();

		return await performClientOCR(
			new File([blob], fileName, { type: 'image/png' }),
			onProgress
		);
	};

	const processFiles = async () => {
		setIsProcessing(true);

		for (const uploadedFile of uploadedFiles.filter(
			(f) => f.status === 'pending'
		)) {
			setUploadedFiles((prev) =>
				prev.map((f) =>
					f.id === uploadedFile.id
						? { ...f, status: 'processing', progress: 0 }
						: f
				)
			);

			try {
				if (uploadedFile.file.type.startsWith('image/')) {
					const validation = validateImageFile(uploadedFile.file);
					if (!validation.valid) {
						throw new Error(validation.error);
					}

					const result: OCRResult = await performClientOCR(
						uploadedFile.file,
						(progress) => {
							setUploadedFiles((prev) =>
								prev.map((f) =>
									f.id === uploadedFile.id
										? { ...f, progress: Math.round(progress * 100) }
										: f
								)
							);
						}
					);

					setUploadedFiles((prev) =>
						prev.map((f) =>
							f.id === uploadedFile.id
								? {
										...f,
										status: 'completed',
										extractedText: result.text,
										pageCount: 1,
										processingMethod: 'Client-side OCR',
										wordCount: result.text
											.trim()
											.split(/\s+/)
											.filter((word) => word.length > 0).length,
										charCount: result.text.length,
										confidence: result.confidence,
										processingTime: result.processingTime,
										progress: 100,
								  }
								: f
						)
					);
				} else {
					const formData = new FormData();
					formData.append('file', uploadedFile.file);

					const response = await fetch('/api/ocr', {
						method: 'POST',
						body: formData,
					});

					if (!response.ok) {
						let errorMessage = 'Failed to process file';

						const contentType = response.headers.get('content-type');
						if (contentType && contentType.includes('application/json')) {
							try {
								const errorData = await response.json();
								errorMessage = errorData.error || errorMessage;
							} catch (jsonError) {
								errorMessage = `Server error (${response.status}): ${response.statusText}`;
							}
						} else {
							try {
								const errorText = await response.text();
								errorMessage = errorText.includes('Internal Server Error')
									? `Server error (${response.status}): Processing failed. Please try again with a smaller file.`
									: `Server error (${response.status}): ${response.statusText}`;
							} catch (textError) {
								errorMessage = `Server error (${response.status}): ${response.statusText}`;
							}
						}

						throw new Error(errorMessage);
					}

					let result;
					try {
						result = await response.json();
					} catch (jsonError) {
						console.error('[v0] Failed to parse success JSON:', jsonError);
						throw new Error(
							'Server returned invalid response. Please try again.'
						);
					}

					if (
						result.requiresClientOCR &&
						result.isScannedPDF &&
						result.images
					) {
						let combinedText = '';
						let totalConfidence = 0;
						let totalProcessingTime = 0;

						for (let i = 0; i < result.images.length; i++) {
							const image = result.images[i];

							setUploadedFiles((prev) =>
								prev.map((f) =>
									f.id === uploadedFile.id
										? {
												...f,
												progress: Math.round(
													((i + 0.5) / result.images.length) * 100
												),
										  }
										: f
								)
							);

							const ocrResult = await processBase64ImageOCR(
								image.imageData,
								`${uploadedFile.file.name}-page-${image.pageNumber}`,
								(progress) => {
									const overallProgress =
										((i + progress) / result.images.length) * 100;
									setUploadedFiles((prev) =>
										prev.map((f) =>
											f.id === uploadedFile.id
												? {
														...f,
														progress: Math.round(overallProgress),
												  }
												: f
										)
									);
								}
							);

							if (ocrResult.text.trim()) {
								combinedText +=
									(combinedText ? '\n\n' : '') +
									`--- Page ${image.pageNumber} ---\n${ocrResult.text}`;
							}

							totalConfidence += ocrResult.confidence;
							totalProcessingTime += ocrResult.processingTime;
						}

						const avgConfidence = totalConfidence / result.images.length;

						setUploadedFiles((prev) =>
							prev.map((f) =>
								f.id === uploadedFile.id
									? {
											...f,
											status: 'completed',
											extractedText: combinedText,
											pageCount: result.pageCount,
											processingMethod: 'Scanned PDF OCR',
											wordCount: combinedText
												.trim()
												.split(/\s+/)
												.filter((word) => word.length > 0).length,
											charCount: combinedText.length,
											confidence: avgConfidence,
											processingTime: totalProcessingTime,
											progress: 100,
									  }
									: f
							)
						);
					} else {
						setUploadedFiles((prev) =>
							prev.map((f) =>
								f.id === uploadedFile.id
									? {
											...f,
											status: 'completed',
											extractedText: result.text,
											pageCount: result.pageCount,
											processingMethod: result.processingMethod,
											wordCount: result.wordCount,
											charCount: result.charCount,
											progress: 100,
									  }
									: f
							)
						);
					}
				}
			} catch (error) {
				console.error('[v0] File processing error:', error);
				setUploadedFiles((prev) =>
					prev.map((f) =>
						f.id === uploadedFile.id
							? {
									...f,
									status: 'error',
									error:
										error instanceof Error
											? error.message
											: 'Unknown error occurred',
									progress: 0,
							  }
							: f
					)
				);
			}
		}

		setIsProcessing(false);
	};

	const removeFile = (id: string) => {
		setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
	};

	const clearAllFiles = () => {
		setUploadedFiles([]);
	};

	const getFileIcon = (file: File) => {
		if (file.type === 'application/pdf') {
			return <FileText className="w-8 h-8 text-red-500" />;
		}
		return <ImageIcon className="w-8 h-8 text-blue-500" />;
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return (
			Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
		);
	};

	const completedFiles = uploadedFiles.filter((f) => f.status === 'completed');
	const processingFiles = uploadedFiles.filter(
		(f) => f.status === 'processing'
	);
	const errorFiles = uploadedFiles.filter((f) => f.status === 'error');

	return (
		<div className="space-y-6">
			<Card>
				<CardContent className="p-8">
					<div
						{...getRootProps()}
						className={cn(
							'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
							isDragActive
								? 'border-primary bg-primary/5'
								: 'border-border hover:border-primary/50 hover:bg-muted/50'
						)}
					>
						<input {...getInputProps()} />
						<Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
						<h3 className="text-lg font-semibold text-foreground mb-2">
							{isDragActive ? 'Drop files here' : 'Upload your documents'}
						</h3>
						<p className="text-muted-foreground mb-4">
							Drag and drop PDF files or images, or click to browse
						</p>
						<p className="text-sm text-muted-foreground">
							Supported formats: PDF, PNG, JPG, JPEG, GIF, BMP, TIFF
						</p>
					</div>
				</CardContent>
			</Card>

			{uploadedFiles.length > 0 && (
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold">
								Uploaded Files ({uploadedFiles.length})
							</h3>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={clearAllFiles}
									disabled={isProcessing}
								>
									Clear All
								</Button>
								<Button
									onClick={processFiles}
									disabled={
										isProcessing ||
										uploadedFiles.every((f) => f.status !== 'pending')
									}
									className="bg-primary hover:bg-primary/90"
								>
									{isProcessing ? 'Processing...' : 'Extract Text'}
								</Button>
							</div>
						</div>

						<div className="space-y-3">
							{uploadedFiles.map((uploadedFile) => (
								<div
									key={uploadedFile.id}
									className="flex items-center gap-4 p-4 border border-border rounded-lg"
								>
									{getFileIcon(uploadedFile.file)}
									<div className="flex-1 min-w-0">
										<p className="font-medium text-foreground truncate">
											{uploadedFile.file.name}
										</p>
										<p className="text-sm text-muted-foreground">
											{formatFileSize(uploadedFile.file.size)}
											{uploadedFile.pageCount && uploadedFile.pageCount > 1 && (
												<span className="ml-2">
													• {uploadedFile.pageCount} pages
												</span>
											)}
											{uploadedFile.status === 'completed' &&
												uploadedFile.confidence && (
													<span className="ml-2">
														• {Math.round(uploadedFile.confidence)}% confidence
													</span>
												)}
											{uploadedFile.status === 'completed' &&
												uploadedFile.processingTime && (
													<span className="ml-2">
														• {(uploadedFile.processingTime / 1000).toFixed(1)}s
													</span>
												)}
										</p>
									</div>
									<div className="flex items-center gap-2">
										{uploadedFile.status === 'pending' && (
											<span className="text-sm text-muted-foreground">
												Ready
											</span>
										)}
										{uploadedFile.status === 'processing' && (
											<div className="flex items-center gap-2">
												<span className="text-sm text-primary">
													Processing...
												</span>
												{uploadedFile.progress !== undefined && (
													<span className="text-xs text-muted-foreground">
														({uploadedFile.progress}%)
													</span>
												)}
											</div>
										)}
										{uploadedFile.status === 'completed' && (
											<span className="text-sm text-green-600">Completed</span>
										)}
										{uploadedFile.status === 'error' && (
											<div className="flex items-center gap-1 text-destructive">
												<AlertCircle className="w-4 h-4" />
												<span className="text-sm">{uploadedFile.error}</span>
											</div>
										)}
										<Button
											variant="ghost"
											size="sm"
											onClick={() => removeFile(uploadedFile.id)}
										>
											Remove
										</Button>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{processingFiles.length > 0 && (
				<div className="space-y-3">
					<h3 className="text-lg font-semibold">Processing Files</h3>
					{processingFiles.map((file) => (
						<ProcessingStatus
							key={file.id}
							fileName={file.file.name}
							status="processing"
							progress={file.progress || 0}
						/>
					))}
				</div>
			)}

			{errorFiles.length > 0 && (
				<div className="space-y-3">
					<h3 className="text-lg font-semibold text-destructive">
						Processing Errors
					</h3>
					{errorFiles.map((file) => (
						<ProcessingStatus
							key={file.id}
							fileName={file.file.name}
							status="error"
							error={file.error}
						/>
					))}
				</div>
			)}

			{completedFiles
				.filter((f) => f.file.type === 'application/pdf')
				.map((file) => (
					<PDFInfoCard
						key={`pdf-info-${file.id}`}
						fileName={file.file.name}
						pageCount={file.pageCount || 1}
						hasSelectableText={file.processingMethod === 'PDF text extraction'}
						processingMethod={file.processingMethod || 'Unknown'}
					/>
				))}

			{completedFiles.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-semibold">Extracted Text Results</h3>
						<p className="text-sm text-muted-foreground">
							{completedFiles.length} file
							{completedFiles.length !== 1 ? 's' : ''} processed
						</p>
					</div>

					{completedFiles.map((file) => (
						<TextResult
							key={`result-${file.id}`}
							fileName={file.file.name}
							extractedText={file.extractedText || ''}
							fileType={file.file.type}
						/>
					))}
				</div>
			)}
		</div>
	);
}
