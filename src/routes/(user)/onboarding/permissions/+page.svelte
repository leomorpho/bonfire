<script lang="ts">
	import { page } from '$app/stores';
	import DeliveryPermissions from '$lib/components/settings/DeliveryPermissions.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowRight } from 'lucide-svelte';

	const styles = `background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/asteroids.jpg'); /* Replace with the URL of your tileable image */
    background-repeat: repeat; /* Tiles the image in both directions */
    background-size: auto; /* Ensures the image retains its original size */
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%; 
  `;
	const overlayStyle = 'background-color: rgba(var(--overlay-color-rgb, 0, 0, 0), 0.4);';

	const permissionClasses =
		'p-3 sm:p-5 bg-slate-100/80 p-3 dark:bg-slate-800/80 rounded-xl space-y-5 w-full';
</script>

<div class="bg-color min-h-screen w-full" style={styles}>
	<div class="bg-overlay min-h-screen" style={overlayStyle}>
		<div class="flex w-full justify-center">
			<div class="mt-4 justify-center sm:w-[450px] md:w-[550px]">
				<div
					class="my-5 w-full space-y-3 rounded-xl bg-slate-100/80 p-3 dark:bg-slate-800/80 sm:p-8"
				>
					<h1 class="flex w-full justify-center text-2xl font-semibold">Grant Permissions?</h1>
					<p class="flex w-full justify-center text-center text-base">
						To enhance your experience, please grant at least one of the permissions below. This
						allows event organizers to send you announcements, reminders, and updates. Rest assured,
						I (Toby, the creator) hate spam, and you'll only receive relevant event information.
					</p>
				</div>

				<div class="space-y-5">
					<DeliveryPermissions userId={$page.data.user.id} class={permissionClasses} />
				</div>

				<a href="/dashboard">
					<Button
						id="finish-permission-onboarding-btn"
						class="mt-6 flex w-full items-center justify-center gap-2"
					>
						<ArrowRight class="h-5 w-5" /> Continue
					</Button>
				</a>
			</div>
		</div>
	</div>
</div>
