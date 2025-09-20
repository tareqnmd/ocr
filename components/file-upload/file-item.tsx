'use client';

import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/client-ocr';
import { AlertCircle, FileText, ImageIcon } from 'lucide-react';
import { type UploadedFile } from '../../types/types';

interface FileItemProps {
	uploadedFile: UploadedFile;
	onRemove: (id: string) => void;
}

export function FileItem({ uploadedFile, onRemove }: FileItemProps) {
	const getFileIcon = (file: File) => {
		if (file.type === 'application/pdf') {
			return <FileText className="w-8 h-8 text-red-500" />;
		}
		return <ImageIcon className="w-8 h-8 text-blue-500" />;
	};

	return (
		<div className="flex items-center gap-4 p-4 border border-border rounded-lg">
			{getFileIcon(uploadedFile.file)}
			<div className="flex-1 min-w-0">
				<p className="font-medium text-foreground truncate">
					{uploadedFile.file.name}
				</p>
				<p className="text-sm text-muted-foreground">
					{formatFileSize(uploadedFile.file.size)}
					{uploadedFile.pageCount && uploadedFile.pageCount > 1 && (
						<span className="ml-2">• {uploadedFile.pageCount} pages</span>
					)}
					{uploadedFile.status === 'completed' && uploadedFile.confidence && (
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
					<span className="text-sm text-muted-foreground">Ready</span>
				)}
				{uploadedFile.status === 'processing' && (
					<div className="flex items-center gap-2">
						<span className="text-sm text-primary">Processing...</span>
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
					onClick={() => onRemove(uploadedFile.id)}
				>
					Remove
				</Button>
			</div>
		</div>
	);
}
