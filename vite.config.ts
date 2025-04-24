import { paraglideVitePlugin } from '@inlang/paraglide-js'
import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	plugins: [
		paraglideVitePlugin({ project: './project.inlang', outdir: './src/paraglide' }),
		sentrySvelteKit({
			sourceMapsUploadOptions: {
				org: 'chatbond',
				project: 'bonfire'
			}
		}),
		sveltekit()
	],
	resolve: {
		alias: {
			$lib: path.resolve(__dirname, 'src/lib')
		}
	},
	server: {
		fs: {
			allow: ['./triplit']
		}
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}']
	}
});
