<script>
	import '../app.css';
	import posthog from 'posthog-js';
	import { browser, dev } from '$app/environment';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import { getMeta } from '$lib/meta';
	import Header from '$lib/components/Header.svelte';
	import { getFlash } from 'sveltekit-flash-message';
	import { Toaster } from '$lib/components/ui/sonner/index';
	import { updated } from '$app/state';
	import { env as publicEnv } from '$env/dynamic/public';
	import { toast } from 'svelte-sonner';

	let { children } = $props();

	if (browser && !dev) {
		beforeNavigate(() => posthog.capture('$pageleave'));
		afterNavigate(() => posthog.capture('$pageview'));
	}
	const meta = $derived(
		getMeta({
			defaultTitle: publicEnv.PUBLIC_DEFAULT_TITLE ?? '',
			defaultDescription: publicEnv.PUBLIC_DEFAULT_DESCRIPTION ?? '',
			defaultOGImage: '/socialcard.jpeg',
			routeMeta: $page.data?.meta ?? {},
			url: $page.url,
			pageParam: $page.params?.page ?? ''
		})
	);

	const flash = getFlash(page);

	// Show toast only in the browser after a new version is deployed
	if (browser && localStorage.getItem('newVersionDeployed')) {
		toast.success("🔥 Bonfire updated! You're now on the latest version.");
		localStorage.removeItem('newVersionDeployed'); // Clear the flag
	}

	beforeNavigate(({ willUnload, to }) => {
		if (updated.current && !willUnload && to?.url) {
			console.log('[PWA] New version detected! Reloading page...');
			if (browser) {
				localStorage.setItem('newVersionDeployed', 'true'); // Store flag only in the browser
			}
			location.href = to.url.href; // Force full-page reload
		}
	});

	// Prevent zooming with javascript
	if (typeof window !== 'undefined') {
		document.addEventListener(
			'gesturestart',
			(event) => {
				event.preventDefault(); // Block pinch-zoom gestures
				document.body.style.zoom = '1'; // Prevents reflow issues
			},
			{ passive: false }
		);

		// document.addEventListener(
		// 	"wheel",
		// 	(event) => {
		// 		if (event.ctrlKey) {
		// 			event.preventDefault(); // Block zooming via Ctrl + Scroll
		// 		}
		// 	},
		// 	{ passive: false }
		// );
	}
</script>

<svelte:head>
	<meta charset="utf-8" />
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1.0, shrink-to-fit=no, user-scalable=no, maximum-scale=1"
	/>

	<!-- <meta
		name="viewport"
		content="viewport-fit=cover, width=device-width, initial-scale=1.0, shrink-to-fit=no, user-scalable=no, maximum-scale=1, height=device-height"
	/> -->

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
	<script>
		iosPWASplash('/icon-192.png', '#000000');
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

	<link rel="icon" href="/favicon.ico" sizes="any" />
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />

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
<div id="main-content-safe-area" class="h-screen">
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
	<Toaster richColors closeButton toastOptions={{}} />
	{@render children()}
</div>

<!-- <style>
	:root {
		--safe-area-top: env(safe-area-inset-top, 0px);
	}

	#main-content-safe-area {
		position: fixed;
		top: var(--safe-area-top, 0);
		left: 0;
		width: 100%;
		z-index: 1000; /* Keep it above other elements */
		background: rgba(255, 255, 255, 0.95); /* Slight transparency */
		padding-top: var(--safe-area-top, 10px); /* Ensure padding below the status bar */
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	@supports (padding-top: env(safe-area-inset-top)) {
		#main-content-safe-area {
			padding-top: env(safe-area-inset-top);
		}
	}
</style> -->
