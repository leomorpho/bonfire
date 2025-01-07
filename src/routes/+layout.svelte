<script>
	import '../app.css';
	import posthog from 'posthog-js';
	import { browser, dev } from '$app/environment';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import { getMeta } from '$lib/meta';
	import {
		PUBLIC_DEFAULT_DESCRIPTION,
		PUBLIC_DEFAULT_TITLE,
		PUBLIC_PROJECT_NAME
	} from '$env/static/public';
	import Header from '$lib/components/Header.svelte';
	import { getFlash } from 'sveltekit-flash-message';
	import { Toaster } from '$lib/components/ui/sonner/index';

	let { children } = $props();

	if (browser && !dev) {
		beforeNavigate(() => posthog.capture('$pageleave'));
		afterNavigate(() => posthog.capture('$pageview'));
	}
	const meta = $derived(
		getMeta({
			defaultTitle: PUBLIC_DEFAULT_TITLE,
			defaultDescription: PUBLIC_DEFAULT_DESCRIPTION,
			defaultOGImage: '/socialcard.jpeg',
			routeMeta: $page.data?.meta ?? {},
			url: $page.url,
			pageParam: $page.params?.page ?? ''
		})
	);

	const flash = getFlash(page);
</script>

<svelte:head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width" />
	<title>{meta.title}</title>
	<meta name="description" content={meta.description} />
	<link rel="canonical" href={meta.canonicalUrl} />

	<!-- PWA -->
	<meta name="application-name" content="Bonfire" />
	<meta name="msapplication-starturl" content="https://todo.app" />
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
	<meta name="apple-mobile-web-app-title" content="Bonfire" />
	<link rel="apple-touch-startup-image" href="ios-startup.png" />
	<meta name="color-scheme" content="light dark" />

	<script src="https://cdn.jsdelivr.net/npm/ios-pwa-splash@1.0.0/cdn.min.js"></script>
	<script >
		iosPWASplash("/icon-192.png", "#000000");
	</script>

	<!--
		  Icons
		  - https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs
			(Usually kept up to date.)
		  - `.ico` is fallback for RSS readers & browsers that don't support SVG:
			 https://caniuse.com/link-icon-svg
	  - `manifest.webmanifest` includes links to 192x192 & 512x512 PNGs.
	  - `apple-touch-icon` is 180x180, but we can use our 192x192 instead.
	  -->

	<link rel="icon" href="/favicon.ico" sizes="32x32" />
	<link rel="icon" href="/icon.svg" type="image/svg+xml" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	<link rel="manifest" href="/manifest.webmanifest" />

	<!--
		Open Graph
		- https://ahrefs.com/blog/open-graph-meta-tags/
	  - https://developers.facebook.com/docs/sharing/webmasters#markup
	  - 1200x630px; `og:height` & `og:width` tags are optional; excluding for minimalism.
	  - For `og:type`, use `article` for blog posts & `website` for the rest (blog index, pages, etc).
		- `og:url` is always the canonical URL.
	  - `og:title` & `og:description` are usually same as page title & meta description, but if those
		  are full of SEO keywords, then the og versions could be different.
	-->

	<meta property="og:type" content={meta.ogType} />
	<meta property="og:title" content={meta.ogTitle} />
	<meta property="og:description" content={meta.ogDescription} />
	<meta property="og:image" content={meta.ogImage} />
	<meta property="og:url" content={meta.ogUrl} />

	<!--
	  Twitter
	  - Twitter uses OG's url, title, description, & image tags.
			https://developer.twitter.com/en/docs/twitter-for-websites/cards/guides/getting-started
	  -->
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<Header></Header>
{#if $flash}
	<div
		class={`m-2 mb-4 rounded-lg p-4 text-sm sm:m-4 md:m-8 ${
			$flash.type === 'success'
				? 'bg-green-50 text-green-800 dark:bg-gray-800 dark:text-green-400'
				: $flash.type === 'error'
					? 'bg-red-50 text-red-800 dark:bg-gray-800 dark:text-red-400'
					: $flash.type === 'warning'
						? 'bg-yellow-50 text-yellow-800 dark:bg-gray-800 dark:text-yellow-400'
						: $flash.type === 'info'
							? 'bg-blue-50 text-blue-800 dark:bg-gray-800 dark:text-blue-400'
							: 'bg-gray-50 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
		}`}
		role="alert"
	>
		{$flash.message}
	</div>
{/if}
<Toaster richColors toastOptions={{}} />
{@render children()}

