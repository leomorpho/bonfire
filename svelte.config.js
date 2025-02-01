import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import * as child_process from 'node:child_process';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess({ postcss: true }),

	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter({
			precompress: false, // Disable automatic compression
			maxRequestBodySize: 100 * 1024 * 1024 // Set to 100MB
		}),
		alias: {
			'@/*': './path/to/lib/*'
		},
		version: {
			pollInterval: 60000 // Check for updates every 60 seconds
		}
	},
	vitePlugin: {
		// Allows you to hold ctrl+shift and click on an item in the browser and it then
		// opens that components location in VSCode
		inspector: {
			holdMode: true
		}
	},
	env: {
		PUBLIC_PROJECT_NAME: 'YourProjectName',
		PUBLIC_ORIGIN: 'https://yourdomain.com',
		PUBLIC_DEFAULT_TITLE: 'Your Project Title',
		PUBLIC_DEFAULT_DESCRIPTION: 'A short description of your project',
		PUBLIC_TRIPLIT_URL: 'https://api.triplit.com',
		PUBLIC_TRIPLIT_ANONYMOUS_TOKEN: 'your-triplit-anonymous-token',
		PUBLIC_S3_BONFIRE_PUCLIC_BUCKET_NAME: 'your-public-s3-bucket',
		PUBLIC_DEV_VAPID_PUBLIC_KEY:
			'BI_hmbKNnT6X_gwPwaTURvcYA21P1NMKsp3SXluHdWTmcWu7ewKB83g0KwZKpwYaGcZsdm09LBC19yeYoEpALdI',
		PUBLIC_VAPID_PUBLIC_KEY:
			'BI_hmbKNnT6X_gwPwaTURvcYA21P1NMKsp3SXluHdWTmcWu7ewKB83g0KwZKpwYaGcZsdm09LBC19yeYoEpALdI'
	}
};

export default config;
