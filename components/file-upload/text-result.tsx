'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Download, FileText } from 'lucide-react';
import { useState } from 'react';

interface TextResultProps {
	fileName: string;
	extractedText: string;
	fileType: string;
}

export function TextResult({
	fileName,
	extractedText,
	fileType,
}: TextResultProps) {
	const [isCopied, setIsCopied] = useState(false);

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(extractedText);
			setIsCopied(true);

			setTimeout(() => setIsCopied(false), 2000);
		} catch (error) {}
	};

	const downloadText = () => {
		const blob = new Blob([extractedText], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${fileName.replace(/\.[^/.]+$/, '')}_extracted.txt`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const wordCount = extractedText.trim().split(/\s+/).length;
	const charCount = extractedText.length;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<FileText className="w-5 h-5 text-primary" />
						<CardTitle className="text-lg">{fileName}</CardTitle>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={copyToClipboard}
							disabled={!extractedText.trim()}
						>
							<Copy className="w-4 h-4 mr-2" />
							{isCopied ? 'Copied!' : 'Copy'}
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={downloadText}
							disabled={!extractedText.trim()}
						>
							<Download className="w-4 h-4 mr-2" />
							Download
						</Button>
					</div>
				</div>
				<div className="flex items-center gap-4 text-sm text-muted-foreground">
					<span>{wordCount} words</span>
					<span>{charCount} characters</span>
					<span className="capitalize">
						{fileType.replace('application/', '').replace('image/', '')}
					</span>
				</div>
			</CardHeader>
			<CardContent>
				<div className="bg-muted rounded-lg p-4 max-h-96 overflow-y-auto">
					{extractedText.trim() ? (
						<pre className="whitespace-pre-wrap text-sm text-foreground font-mono leading-relaxed">
							{extractedText}
						</pre>
					) : (
						<p className="text-muted-foreground italic">
							No text was found in this file.
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
