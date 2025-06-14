<script lang="ts">
	import { page } from '$app/stores';
	import DeleteAccount from '$lib/components/settings/DeleteAccount.svelte';
	import ResetLocalData from '$lib/components/settings/ResetLocalData.svelte';
	import FadeIn from '$lib/components/containers/FadeIn.svelte';
	import NotificationTypes from '$lib/components/settings/NotificationTypes.svelte';
	import DeliveryPermissions from '$lib/components/settings/DeliveryPermissions.svelte';
	import PhoneNumber from '$lib/components/settings/PhoneNumber.svelte';
	import { Button } from '$lib/components/ui/button';
</script>

<FadeIn>
	<div class="mx-2 mb-10 flex flex-col items-center justify-center">
		<!-- History of thoughts and moods -->
		<section class="mt-2 w-full px-5 sm:w-[450px]">
			<h2 class="my-6 text-2xl font-semibold">Settings</h2>

			<NotificationTypes userId={$page.data.user.id} class="mt-10 space-y-5" />
			<DeliveryPermissions userId={$page.data.user.id} class="mt-10 space-y-5" />
			<PhoneNumber userId={$page.data.user.id} class="mt-10 space-y-5" />

			<div class="mt-10 space-y-5">
				<h3 class="text-xl font-semibold">Privacy</h3>
				<div class="flex flex-col justify-center space-y-3">
					<Button href="/settings/blocked-users" variant="outline">Block Users</Button>
				</div>
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

			<h2 class="my-6 text-2xl font-semibold">App Info</h2>
			<div class="flex flex-col justify-center space-y-3">
				<Button href="/terms-of-use">Terms of use</Button>
				<Button href="/privacy-policy">Privacy policy</Button>
				<Button href="/feedback">Give feedback</Button>
			</div>
		</section>
	</div>
</FadeIn>
