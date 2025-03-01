<script lang="ts">
	import PushPermissions from '$lib/components/PushPermissions.svelte';
	import { page } from '$app/stores';
	import DeleteAccount from '$lib/components/settings/DeleteAccount.svelte';
	import ResetLocalData from '$lib/components/settings/ResetLocalData.svelte';
	import { Button } from '$lib/components/ui/button';
</script>

<div class="mx-2 flex flex-col items-center justify-center mb-10">
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
			<PushPermissions
				subscriptions={$page.data.subscriptions}
				permissions={$page.data.permissions}
			/>
		</div>

		<div class="mt-10 space-y-5">
			<h3 class="flex justify-between text-xl font-semibold">Payments</h3>
			<a href={'settings/transactions-history'} class="flex flex-col justify-center space-y-3">
				<Button>Transactions History</Button>
			</a>
		</div>

		<div class="mt-10 space-y-5">
			<h3 class="flex justify-between text-xl font-semibold">App</h3>
			<div class="flex flex-col justify-center space-y-3">
				<ResetLocalData />
			</div>
		</div>

		<div class="mt-10 space-y-5">
			<h3 class="text-xl font-semibold">Danger</h3>

			<div class="flex flex-col justify-center space-y-3">
				<DeleteAccount />
			</div>
		</div>
	</section>
</div>
