<script lang="ts">
	import PushPermissions from '$lib/components/PushPermissions.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { page } from '$app/stores';
</script>

<div class="mx-2 flex flex-col items-center justify-center">
	<!-- History of thoughts and moods -->
	<section class="mt-2 w-full px-5 sm:w-[450px]">
		<h2 class="my-6 text-2xl font-semibold">Settings</h2>

		<div class="mt-10 space-y-5">
			<PushPermissions
				subscriptions={$page.data.subscriptions}
				permissions={$page.data.permissions}
			/>
		</div>

		<div class="mt-10 space-y-5">
			<h3 class="text-xl font-semibold">Danger</h3>

			<div class="flex flex-col justify-center space-y-3">
				<Button class="bg-red-500 hover:bg-red-400">Delete Account</Button>
			</div>
		</div>
	</section>
</div>
