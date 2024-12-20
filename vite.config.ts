import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	server: { fs: { allow: ['./triplit'] } },
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.test.ts']
	}
});
