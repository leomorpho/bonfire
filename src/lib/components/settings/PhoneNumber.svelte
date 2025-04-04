<script lang="ts">
	import { PhoneInput } from '$lib/jsrepo/ui/phone-input';
	import { Pencil } from 'lucide-svelte';
	import Button from '../ui/button/button.svelte';

	let { phoneNumber = null, country = null } = $props();
</script>

<div class="w-full space-y-5">
	<h3 class="flex justify-between text-xl font-semibold">Phone</h3>

	<div class="flex w-full items-center justify-center space-x-2">
		<PhoneInput
			bind:value={phoneNumber}
			bind:country
			readonly={true}
			disabled={true}
			class="w-full"
		/>
		<a href="/settings/phone">
			<Button
				class="h-8 w-8 rounded-full bg-slate-200 text-black hover:bg-slate-300 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
			>
				<Pencil class="h-4 w-4" />
			</Button>
		</a>
	</div>
</div>
