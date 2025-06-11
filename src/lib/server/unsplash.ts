import { createApi } from 'unsplash-js';
import nodeFetch from 'node-fetch';
import { env as privateEnv } from '$env/dynamic/private';

export const unsplash = createApi({
	accessKey: privateEnv.UNSPLASH_ACCESS_KEY,
	fetch: nodeFetch
});
