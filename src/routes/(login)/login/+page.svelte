<script lang="ts">
	import { tick } from 'svelte';
	import Google from '$lib/components/icons/Google.svelte';
	import { superForm } from 'sveltekit-superforms';
	import { Mail } from 'lucide-svelte';
	import { Image } from '@unpic/svelte';
	import { tempAttendeeIdFormName, tempAttendeeIdUrlParam } from '$lib/enums.js';
	import { page } from '$app/stores';

	const { data } = $props();

	let email_input: HTMLInputElement | null = $state(null);
	let show_email_input = $state(false);
	let email_sent = $state(false);

	const { enhance, errors, submitting } = superForm(data.form, {
		onResult(event) {
			console.log(event);
			if (event.result.type === 'success') {
				email_sent = true;
			}
		}
	});

	const handleEmail = async () => {
		if (!show_email_input && email_input) {
			show_email_input = true;
			await tick();
			email_input.focus();
		}
	};

	const tempAttendeeId = $page.url.searchParams.get(tempAttendeeIdUrlParam);
	console.log('tempAttendeeId', tempAttendeeId);
</script>

<svelte:head>
	<title>Bonfire</title>
	<meta
		name="description"
		content="Effortlessly organize your social gatherings with your friends and loved ones."
	/>
</svelte:head>

<div class="flex h-screen items-center justify-center p-5">
	<div class="card flex w-full max-w-[470px] flex-col p-5">
		{#if email_sent}
			<div class="text-center">
				<Mail size="40" class="mx-auto my-4" />
				<div class="text-3xl font-bold leading-none tracking-tight">Check your inbox</div>
				<div class="text-muted-primary mx-auto mt-4 max-w-[32ch] text-lg opacity-80">
					We've sent you a login link. Please be sure to check your spam folder too.
				</div>
			</div>
		{:else}
			<div class="my-4 flex w-full flex-col space-y-1.5 text-center">
				<div class="mx-auto w-fit max-w-64">
					<Image
						class="max-w-64 rounded-lg"
						height={834}
						width={1000}
						src="https://f002.backblazeb2.com/file/bonfire-public/logo/Bonfire_logo_vert_color.png"
						layout="constrained"
						alt="Bonfire logo with name"
					/>
				</div>
			</div>
			{#if data.user}
				<a href="/" class="text-md btn btn-primary mt-4 w-full font-semibold md:text-lg"
					>Continue with current account
				</a>
				<p class="my-3 text-center text-sm opacity-70">
					Signed in as {data.user.email}
				</p>
			{:else}
				<a href="/login/google" class="text-md btn btn-primary mt-4 w-full font-semibold md:text-lg"
					><Google class="mr-3 w-4" />Continue with Google
				</a>{/if}

			{#if data.user}
				<form method="post" action="/login?/signout">
					<button type="submit" class="text-md btn btn-ghost mt-2 w-full font-semibold sm:text-lg"
						>Sign in with a different account
					</button>
				</form>
			{:else}
				<form method="post" action="/login?/login_with_email" use:enhance>
					<!-- Add tempAttendeeId as a hidden input -->
					{#if tempAttendeeId}
						<input type="hidden" name={tempAttendeeIdFormName} value={tempAttendeeId} />
					{/if}

					<input
						bind:this={email_input}
						placeholder="Email"
						type="email"
						name="email"
						class="input my-5 w-full"
						class:hidden={!show_email_input}
					/>
					{#if $errors.email}
						<span class="ml-1 mt-2 text-xs text-red-500">{$errors.email}</span>
					{/if}

					{#if show_email_input}
						<button
							type="submit"
							disabled={$submitting}
							class="text-md btn w-full font-semibold sm:text-lg"
						>
							{#if $submitting}
								<span class="loading loading-spinner loading-xs mr-2"></span>
							{/if}
							<span>Continue</span>
						</button>
					{:else}
						<button
							onclick={handleEmail}
							type="button"
							class="text-md btn mt-4 w-full font-semibold sm:text-lg"
							>Continue with email
						</button>{/if}
				</form>
			{/if}
		{/if}
	</div>
</div>
