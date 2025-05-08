<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { PlatformBrowser } from '$lib/enums';
	import { MonitorDown } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import ChromeDesktopInstall from './icons/ChromeDesktopInstall.svelte';
	import { Share } from '@lucide/svelte';

	let isStandalone = $state(false);
	let isPwaSupported = $state(false);
	let platformBrowser = $state<PlatformBrowser>(PlatformBrowser.UNSUPPORTED);

	onMount(() => {
		// Function to update standalone mode
		const updateStandaloneMode = () => {
			isStandalone = window.matchMedia('(display-mode: standalone)').matches;
		};

		// Initial check
		updateStandaloneMode();

		// Check if the browser supports PWA features
		if ('serviceWorker' in navigator && 'PushManager' in window) {
			isPwaSupported = true;

			// Detect the platform and browser
			const userAgent = navigator.userAgent;
			const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
			const isAndroid = /android/i.test(userAgent);
			const isChrome = userAgent.includes('Chrome') && !isIOS;
			const isFirefox = userAgent.includes('Firefox');
			const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
			const isEdge = userAgent.includes('Edg');

			if (isIOS) {
				platformBrowser = isSafari ? PlatformBrowser.IOS_SAFARI : PlatformBrowser.IOS_OTHER;
			} else if (isAndroid) {
				if (isChrome) {
					platformBrowser = PlatformBrowser.ANDROID_CHROME;
				} else if (isFirefox) {
					platformBrowser = PlatformBrowser.ANDROID_FIREFOX;
				} else if (isSafari) {
					platformBrowser = PlatformBrowser.ANDROID_SAFARI;
				} else if (isEdge) {
					platformBrowser = PlatformBrowser.ANDROID_EDGE;
				} else {
					platformBrowser = PlatformBrowser.ANDROID_OTHER;
				}
			} else {
				if (isChrome) {
					platformBrowser = PlatformBrowser.DESKTOP_CHROME;
				} else if (isFirefox) {
					platformBrowser = PlatformBrowser.DESKTOP_FIREFOX;
				} else if (isSafari) {
					platformBrowser = PlatformBrowser.DESKTOP_SAFARI;
				} else if (isEdge) {
					platformBrowser = PlatformBrowser.DESKTOP_EDGE;
				} else {
					platformBrowser = PlatformBrowser.DESKTOP_OTHER;
				}
			}
			// Cleanup event listener on component destroy
			return () => {
				window
					.matchMedia('(display-mode: standalone)')
					.removeEventListener('change', updateStandaloneMode);
			};
		}
	});
</script>

{#if !isStandalone && isPwaSupported}
	<Dialog.Root>
		<Dialog.Trigger>
			<div
				class="m-1 flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
			>
				<MonitorDown class="h-5 w-5" />
			</div>
		</Dialog.Trigger>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title class="mb-5 flex w-full justify-center">Install the App</Dialog.Title>
				<Dialog.Description>
					<p class="my-5">
						Note that the app can be used without installation. However, if you want to receive
						event notifications, the app must be installed.
					</p>

					{#if platformBrowser === PlatformBrowser.IOS_SAFARI}
						<p>Use Safari: Tap the "Share" icon and select "Add to Home Screen".</p>
					{:else if platformBrowser === PlatformBrowser.IOS_OTHER}
						<p>
							On iOS, only Safari can be used to install the app. Please open this page in Safari
							and try again.
						</p>
					{:else if platformBrowser === PlatformBrowser.ANDROID_CHROME}
						<p>Use Chrome: Tap the menu icon (three dots) and select "Install app".</p>
					{:else if platformBrowser === PlatformBrowser.ANDROID_FIREFOX}
						<p>Use Firefox: Tap the menu icon (three dots) and select "Install".</p>
					{:else if platformBrowser === PlatformBrowser.ANDROID_SAFARI}
						<p>
							Use Safari: Tap the <Share class="mx-1 inline align-middle" /> icon and select "Add to
							Home Screen".
						</p>
					{:else if platformBrowser === PlatformBrowser.ANDROID_EDGE}
						<p>Use Edge: Tap the menu icon (three dots) and select "Install app".</p>
					{:else if platformBrowser === PlatformBrowser.ANDROID_OTHER}
						<p>Your browser is not supported. Please use Chrome, Firefox, Safari, or Edge.</p>
					{:else if platformBrowser === PlatformBrowser.DESKTOP_CHROME}
						<p>
							Use Chrome: Click on the <ChromeDesktopInstall class="mx-1 inline align-middle" />icon
							in the URL bar.
						</p>
					{:else if platformBrowser === PlatformBrowser.DESKTOP_FIREFOX}
						<p>Use Firefox: Click on the home icon with a plus sign in the URL bar.</p>
					{:else if platformBrowser === PlatformBrowser.DESKTOP_SAFARI}
						<p>
							Use Safari: Click on the <Share class="mx-1 inline align-middle" /> icon in the top navbar
							and select "Add to Dock".
						</p>
					{:else if platformBrowser === PlatformBrowser.DESKTOP_EDGE}
						<p>Use Edge: Click on the "Install" icon in the URL bar.</p>
					{:else}
						<p>Your browser is not supported. Please use Chrome, Firefox, Safari, or Edge.</p>
					{/if}
				</Dialog.Description>
			</Dialog.Header>
		</Dialog.Content>
	</Dialog.Root>
{/if}
