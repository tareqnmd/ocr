import { BASE_URL } from '@/constant';
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: BASE_URL,
			lastModified: new Date(),
			changeFrequency: 'yearly',
			priority: 1,
		},
		{
			url: BASE_URL + '/login',
			lastModified: new Date(),
			changeFrequency: 'monthly',
			priority: 0.8,
		},
	];
}
