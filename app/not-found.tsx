import Link from 'next/link';

const NotFound = () => {
	return (
		<main className="grid min-h-screen place-items-center">
			<div className="grid place-items-center gap-2">
				<h1 className="text-center text-xl font-semibold text-white">
					Not Found!
				</h1>
				<Link
					href={'/'}
					className="text-primary font-medium underline"
				>
					Go back to home
				</Link>
			</div>
		</main>
	);
};

export default NotFound;
