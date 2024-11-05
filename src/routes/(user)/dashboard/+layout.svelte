<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { userIdStore, waitForEThree } from '$lib/e3kit';
	import { onMount } from 'svelte';

// This is where we redirect to decryption page if there is no local private key
    onMount(() => {
		const initEThree = async () => {
			userIdStore.set($page.data.user.id)

			
			// Ensure eThreeReady is initialized
			const eThree = await waitForEThree();
			console.log(`eThree....: ${eThree}`);
			// @ts-ignore
			const hasLocalPrivateKey = await eThree.hasLocalPrivateKey();
			if (!hasLocalPrivateKey) {
				goto('/encryption/decrypt');
			}
		};

		initEThree().catch((error) => {
			console.error('Failed to initialize eThree:', error);
		});
	});
</script>

<slot />
