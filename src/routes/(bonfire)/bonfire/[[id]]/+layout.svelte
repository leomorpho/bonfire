<script lang="ts">
	import { dev } from '$app/environment';
	import { onMount, type Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { overlayColorStore, overlayOpacityStore, parseColor, styleStore } from '$lib/styles';
	import { tempAttendeeSecretStore, tempAttendeeSecretParam } from '$lib/enums';
	import { get } from 'svelte/store';
	import { setTempAttendeeInfoInLocalstorage } from '$lib/utils';
	import { addUserRequests } from '$lib/profilestore';
	import type { WorkerClient } from '@triplit/client/worker-client';
	import InstallPwaBtn from '$lib/components/InstallPwaBtn.svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	let styles: string = $state('');
	let overlayColor: string = $state('#000000');
	let overlayOpacity: number = $state(0.5);
	let client: WorkerClient | undefined = $state();
	let styleData = $state();

	// Subscribe to the stores for reactive updates, this allows updating the styles
	// on the event page when redirected from the update page.
	styleStore.subscribe((value) => {
		styles = value;
	});
	overlayColorStore.subscribe((value) => {
		overlayColor = value;
	});
	overlayOpacityStore.subscribe((value) => {
		overlayOpacity = value;
	});

	// Access the `temp` parameter from the query string
	let tempAttendeeSecret: string | null = $state(null);

	// Use a reactive statement to react to changes in the `$page` store
	const url = $page.url;
	tempAttendeeSecret = url.searchParams.get(tempAttendeeSecretParam);

	if ($page.data.event) {
		styleStore.set($page.data.event.style ?? '');
		overlayColorStore.set($page.data.event.overlay_color ?? '');
		overlayOpacityStore.set($page.data.event.overlay_opacity ?? '');
	} else {
		styleStore.set(`
    --background-color: #e5e5f7;
    --primary-color: #444cf7;
    --circle-size: 15px; /* Size of the repeating radial pattern */
    --opacity-level: 1;
    background-color: var(--background-color);
    opacity: var(--opacity-level);
    background-image: 
        radial-gradient(circle at center center, var(--primary-color), var(--background-color)),
        repeating-radial-gradient(circle at center center, var(--primary-color), var(--primary-color), var(--circle-size), transparent calc(var(--circle-size) * 2), transparent var(--circle-size));
    background-blend-mode: multiply;
        `);
		overlayColorStore.set('#000000');
		overlayOpacityStore.set(0.2);
	}

	// Function to get query parameters from the URL
	function getQueryParam(param: string) {
		const urlParams = new URLSearchParams(window.location.search);
		return urlParams.get(param);
	}

	onMount(() => {
		let unsubscribeFromUserQuery: any;
		let previousUsers: Record<string, string> = {}; // Stores previous user data as stringified JSON

		if ($page.data.user) {
			client = getFeWorkerTriplitClient($page.data.jwt);

			// Subscribe to live updates of attendees and their profile images
			unsubscribeFromUserQuery = client.subscribe(
				client
					.query('user')
					.Include('profile_image')
					.Where(['attendances.event.id', '=', $page.params.id])
					,
				(results) => {
					// Map new users into an object for quick lookup
					const currentUsers: Record<string, string> = {};
					const userIdsWhoChanged: string[] = [];

					results.forEach((user) => {
						const userId = user.id;
						const userHash = JSON.stringify(user); // Serialize user data

						currentUsers[userId] = userHash;

						// If user changed OR does not exist in previousUsers, mark for update
						if (!previousUsers[userId] || previousUsers[userId] !== userHash) {
							userIdsWhoChanged.push(userId);
						}
					});

					// Update previousUsers reference
					previousUsers = currentUsers;

					// If changes detected, refresh those users with bypassCache = true
					if (userIdsWhoChanged.length > 0) {
						addUserRequests(userIdsWhoChanged.map((userId) => ({ userId, bypassCache: true })));
					}
				},
				(error) => {
					console.error('Error fetching current temporary attendee:', error);
				},
				{
					localOnly: false,
					onRemoteFulfilled: () => {}
				}
			);
		}

		// Cleanup function to unsubscribe when component unmounts
		return () => {
			if (unsubscribeFromUserQuery) {
				unsubscribeFromUserQuery();
			}
		};
	});

	onMount(async () => {
		if (tempAttendeeSecret) {
			tempAttendeeSecretStore.set(tempAttendeeSecret);
			if (!$page.data.user) {
				setTempAttendeeInfoInLocalstorage($page.params.id, tempAttendeeSecret);
			}
		} else {
			tempAttendeeSecret = get(tempAttendeeSecretStore);
		}

		// TODO: ONLY use sessionStorage instead of the tempAttendeeSecretStore
		// Store the temp-secret if it exists
		const tempSecret = getQueryParam(tempAttendeeSecretParam);
		if (tempSecret) {
			sessionStorage.setItem(tempAttendeeSecretParam, tempSecret);
		}

		page.subscribe(($page) => {
			const storedSecret = sessionStorage.getItem(tempAttendeeSecretParam);

			// 🔥 If user is logged in, remove the temp-secret param
			if ($page.data.user) {
				updateURLWithoutSecret();
			}

			// Otherwise, ensure temp-secret is restored when missing
			if (storedSecret && !$page.url.searchParams.has(tempAttendeeSecretParam)) {
				updateURLWithSecret(storedSecret);
			}
		});

		if ($page.data.user || tempAttendeeSecret) {
			// User is logged in
			client = getFeWorkerTriplitClient($page.data.jwt);
			const styleDataQuery = client
				.query('events')
				.Where(['id', '=', $page.params.id])
				.Select(['style', 'overlay_color', 'overlay_opacity'])
				;

			styleData = await client.fetchOne(styleDataQuery);
			if (styleData) {
				styles = styleData.style ?? '';
				overlayColor = styleData.overlay_color ?? '#000000';
				overlayOpacity = styleData.overlay_opacity ?? 0.5;
				styleStore.set(styleData.style || '');
				overlayColorStore.set(overlayColor);
				overlayOpacityStore.set(overlayOpacity);
			}
		}
		console.log('styles', styles);
		console.log('overlayColor', overlayColor);
		console.log('overlayOpacity', overlayOpacity);
	});

	let overlayStyle = $derived(
		`background-color: rgba(var(--overlay-color-rgb, ${parseColor(overlayColor)}), ${overlayOpacity});`
	);

	function updateURLWithSecret(secret: string) {
		if (!secret) return;

		const url = new URL(window.location.href);
		url.searchParams.set(tempAttendeeSecretParam, secret);

		// 🔥 Forcefully update the URL and reload the page BEFORE back navigation happens
		location.replace(url.toString());
	}

	function updateURLWithoutSecret() {
		const url = new URL(window.location.href);
		url.searchParams.delete(tempAttendeeSecretParam);

		// Remove the param from sessionStorage
		sessionStorage.removeItem(tempAttendeeSecretParam);
		tempAttendeeSecretStore.set('');

		// Replace the current state with the updated URL
		window.history.replaceState(null, '', url.toString());
	}
</script>

<div class="bg-color min-h-screen w-full bonfire-layout" style={styles}>
	<div class="bg-overlay min-h-screen" style={overlayStyle}>
		{@render children()}
	</div>
</div>

{#if tempAttendeeSecret || ($page.data.user && $page.data.user.id)}
	<InstallPwaBtn />
{/if}
