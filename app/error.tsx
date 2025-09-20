'use client';

import { Button } from '@/components/ui/button';

const Error = ({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) => {
	return (
		<main className="min-h-screen grid place-items-center">
			<div className="grid place-items-center gap-1">
				<h1 className="text-xl font-semibold text-white text-center">
					{error.message}
				</h1>
				<Button
					className="p-0 underline bg-transparent text-primary"
					onClick={reset}
				>
					Reset
				</Button>
			</div>
		</main>
	);
};

export default Error;
