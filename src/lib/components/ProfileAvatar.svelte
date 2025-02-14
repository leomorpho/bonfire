<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { formatHumanReadable } from '$lib/utils';
	import { UserRoundMinus } from 'lucide-svelte';
	import GeneratedAvatar from './GeneratedAvatar.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { page } from '$app/stores';
	import type { TriplitClient } from '@triplit/client';
	import { getFeTriplitClient } from '$lib/triplit';
	import { toast } from 'svelte-sonner';

	let {
		url,
		fullsizeUrl = null,
		fallbackName = '',
		username,
		isTempUser = false,
		lastUpdatedAt = null,
		viewerIsEventAdmin = false,
		attendanceId = null, // NOTE: these can be either real or temp attendances (they are different object types)
		baseHeightPx = 50
	} = $props();

	let attendanceIsAboutToBeDeleted = $state(false);
	const fallbackNameShort = fallbackName.slice(0, 2);
	const eventId = $page.params.id;
	let dialogIsOpen = $state(false);

	const deleteRealAttendee = async () => {
		const client = getFeTriplitClient($page.data.jwt) as TriplitClient;
		await client.delete('attendees', attendanceId);
	};

	const deleteTempAttendee = async () => {
		const client = getFeTriplitClient($page.data.jwt) as TriplitClient;
		await client.delete('temporary_attendees', attendanceId);
	};

	const deleteAttendee = async () => {
		if (!viewerIsEventAdmin && attendanceId) {
			return;
		}
		try {
			if (isTempUser) {
				deleteTempAttendee();
			} else {
				deleteRealAttendee();
			}
			toast.success(`Deleted ${username ? username : 'attendee'} from event`);
			dialogIsOpen = false;
		} catch (e) {
			console.error(
				`failed to remove ${isTempUser ?? 'temp'} attendee from event with id ${eventId}`,
				e
			);
		} finally {
			// NOTE: if we don't set it back to true, I have observed that a new ProfileAvatar may open in delete mode. Not great UX experience.
			attendanceIsAboutToBeDeleted = false;
		}
	};

	const handleRemoveUser = () => {
		attendanceIsAboutToBeDeleted = true;
	};

	const handleCancelRemoveUser = () => {
		attendanceIsAboutToBeDeleted = false;
	};
</script>

<Dialog.Root bind:open={dialogIsOpen}>
	<Dialog.Trigger
		class="profile-avatar flex items-center justify-center focus:outline-none focus-visible:ring-0"
	>
		{#if fullsizeUrl || url}
			<Avatar.Root
				class={`relative ${
					isTempUser ? 'border-yellow-300' : 'border-white'
				}`}
				style="height: {baseHeightPx}px; width: {baseHeightPx}px;"
			>
				<!-- Avatar Image -->
				<Avatar.Image src={url} alt={username} class="h-full w-full" />

				<!-- Fallback Text -->
				<Avatar.Fallback class="absolute inset-0 flex items-center justify-center">
					{fallbackNameShort}
				</Avatar.Fallback>

				<!-- Overlay Layer for Temp User -->
				{#if isTempUser}
					<div class="pointer-events-none absolute inset-0 bg-yellow-300 opacity-40"></div>
				{/if}
			</Avatar.Root>
		{:else}
			<div class="relative">
				<GeneratedAvatar {username} size={baseHeightPx} />
				{#if isTempUser}
					<div class="pointer-events-none absolute inset-0 rounded-full border-4 border-yellow-400">
						<div class="flex h-full w-full items-center justify-center">{fallbackNameShort}</div>
					</div>
				{:else}
					<div class="pointer-events-none absolute inset-0 rounded-full">
						<div class="flex h-full w-full items-center justify-center">{fallbackNameShort}</div>
					</div>
				{/if}
			</div>
		{/if}
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			{#if attendanceIsAboutToBeDeleted}
				<div class="space-y-8">
					<h1 class="text-xl font-bold">Are you absolutely sure?</h1>
					<p>
						This action cannot be undone. This will remove {username ? username : 'this user'} from this
						event.
					</p>
					<div class="space-y-2">
						<Button
							onclick={deleteAttendee}
							class="flex w-full items-center justify-center bg-red-500 hover:bg-red-400"
						>
							Yes, remove</Button
						>
						<Button
							onclick={handleCancelRemoveUser}
							class="flex w-full items-center justify-center "
						>
							Cancel</Button
						>
					</div>
				</div>
			{:else}
				<Dialog.Title class="flex justify-center">{username}</Dialog.Title>
				<Dialog.Description>
					{#if isTempUser}
						<div class="m-3 flex justify-center rounded-lg bg-yellow-400 p-2 text-black">
							Temporary account
						</div>
					{/if}
					{#if lastUpdatedAt}
						<div class="flex justify-center">Last updated {formatHumanReadable(lastUpdatedAt)}</div>
					{/if}
					<div class="mt-3 flex w-full items-center justify-center text-3xl text-black md:text-4xl">
						{#if fullsizeUrl || url}
							<Avatar.Root class="mt-3 aspect-square h-fit w-fit">
								<Avatar.Image src={fullsizeUrl ? fullsizeUrl : url} alt={username} />
								<Avatar.Fallback>{fallbackNameShort}</Avatar.Fallback>
								<!-- Overlay Layer for Temp User -->
							</Avatar.Root>
						{:else}
							<div class="relative">
								<GeneratedAvatar {username} size={200} />
								{#if isTempUser}
									<div
										class="pointer-events-none absolute inset-0 rounded-full border-8 border-yellow-400"
									>
										<div class="flex h-full w-full items-center justify-center">
											{fallbackNameShort}
										</div>
									</div>
								{:else}
									<div class="pointer-events-none absolute inset-0 rounded-full">
										<div class="flex h-full w-full items-center justify-center">
											{fallbackNameShort}
										</div>
									</div>
								{/if}
							</div>
						{/if}
					</div>
					{#if viewerIsEventAdmin}
						<Button
							onclick={handleRemoveUser}
							class="mt-4 flex w-full items-center justify-center bg-red-500 hover:bg-red-400"
						>
							<UserRoundMinus class="h-5 w-5" />
							Remove user from event</Button
						>
					{/if}
				</Dialog.Description>
			{/if}
		</Dialog.Header>

		<Dialog.Footer></Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
