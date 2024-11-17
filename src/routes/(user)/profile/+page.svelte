<script lang="ts">
	import { page } from '$app/stores';
	import { writable } from 'svelte/store';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
</script>

<div class="mx-2 flex flex-col items-center justify-center">
	<!-- History of thoughts and moods -->
	<section class="mt-8 w-full sm:w-[450px]">
		<h2 class="my-6 text-2xl font-semibold">Profile</h2>

		<div class="flex flex-col justify-center space-y-3">
			<Button href="username">Update username</Button>
		</div>
	</section>
</div>
