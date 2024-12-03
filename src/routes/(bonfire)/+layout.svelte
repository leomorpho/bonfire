<script lang="ts">
	import { page } from '$app/stores';
	import { userIdStore } from '$lib/triplit';

	if ($page.data.user) {
		userIdStore.set($page.data.user.id);
	}
</script>

<div class="bg-color min-h-screen w-full">
	<slot />
</div>

<style>
	.bg-color {
		--s: 75px; /* control the size*/
		--c1: #c02942;
		--c2: #53777a;
		--c3: #ecd078;
		--c4: #d95b43;

		background:
			radial-gradient(var(--c1) 24%, #0000 25%),
			radial-gradient(var(--c2) 30%, #0000 32%) calc(var(--s) / 2) calc(var(--s) / 2),
			repeating-conic-gradient(from 30deg, var(--c3) 0 30deg, var(--c4) 0 25%);
		background-size: var(--s) var(--s);
	}
</style>
