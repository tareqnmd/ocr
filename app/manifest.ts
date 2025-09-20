import { APP_DESCRIPTION, APP_NAME, APP_THEME_COLOR } from '@/constant';
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: APP_NAME,
		short_name: APP_NAME,
		description: APP_DESCRIPTION,
		start_url: '/',
		display: 'standalone',
		background_color: APP_THEME_COLOR,
		theme_color: APP_THEME_COLOR,
		icons: [
			{
				src: 'images/android-chrome-192x192.png',
				sizes: '192x192',
				type: 'image/png',
			},
			{
				src: 'images/android-chrome-512x512.png',
				sizes: '512x512',
				type: 'image/png',
			},
			{
				src: 'images/apple-touch-icon.png',
				sizes: '180x180',
				type: 'image/png',
			},
			{
				src: 'images/favicon-32x32.png',
				sizes: '32x32',
				type: 'image/png',
			},
			{
				src: 'images/favicon-16x16.png',
				sizes: '16x16',
				type: 'image/png',
			},
			{
				src: '/favicon.ico',
				sizes: '64x64 32x32 24x24 16x16',
				type: 'image/x-icon',
			},
		],
	};
}
