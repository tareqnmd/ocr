import { FileUpload } from '@/components/file-upload/file-upload';
import { Header } from '@/components/header';

export default function Home() {
	return (
		<div className="min-h-screen bg-background">
			<Header />
			<main className="container mx-auto px-4 py-8">
				<div className="max-w-4xl mx-auto">
					<div className="text-center mb-8">
						<h1 className="text-4xl font-bold text-foreground mb-4 text-balance">
							Extract Text from Documents & Images
						</h1>
						<p className="text-lg text-muted-foreground text-pretty">
							Upload PDFs or images and get clean, readable text extracted using
							advanced OCR technology. Perfect for digitizing documents,
							research, and data processing.
						</p>
					</div>
					<FileUpload />
				</div>
			</main>
		</div>
	);
}
