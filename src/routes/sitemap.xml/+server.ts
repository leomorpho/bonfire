import * as sitemap from 'super-sitemap';
import type { RequestHandler } from '@sveltejs/kit';
import { env as publicEnv } from '$env/dynamic/public';

export const GET: RequestHandler = async () => {
	return await sitemap.response({
		origin: publicEnv.PUBLIC_ORIGIN,
		excludeRoutePatterns: ['^/stripe/.*', '.*\\(login\\).*']
	});
};
