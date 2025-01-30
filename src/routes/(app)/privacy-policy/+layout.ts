import type { Meta } from '$lib/meta';
import { env as publicEnv } from '$env/dynamic/public';

export const load = async () => {
	const meta: Meta = {
		title: `${publicEnv.PUBLIC_PROJECT_NAME} | Privacy Policy`,
		description: `The privacy policy for ${publicEnv.PUBLIC_PROJECT_NAME}`
	};
	return { meta };
};
