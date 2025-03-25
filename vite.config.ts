import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		sentrySvelteKit({
			sourceMapsUploadOptions: {
				org: 'chatbond',
				project: 'bonfire'
			}
		}),
		sveltekit()
	],
	server: {
		fs: {
			allow: ['./triplit']
		}
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.test.ts']
	}
});
