<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { formatHumanReadable } from '$lib/utils';
	import { UserRoundMinus } from 'lucide-svelte';
	import GeneratedAvatar from '../../GeneratedAvatar.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { page } from '$app/stores';
	import type { TriplitClient } from '@triplit/client';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { toast } from 'svelte-sonner';
	import {
		addUserRequest,
		deleteUserLiveDataStoreEntry,
		tempUsersLiveDataStore,
		usersLiveDataStore
	} from '$lib/profilestore';
	import { onDestroy, onMount } from 'svelte';
	import { removeRealAttendee, removeTempAttendee } from '$lib/rsvp';
	import TriggerButton from './TriggerButton.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import ProfileHistory from './history/ProfileHistory.svelte';
	import { env as publicEnv } from '$env/dynamic/public';

	let {
		userId = null,
		tempUserId = null,
		viewerIsEventAdmin = false,
		userIsEventAdmin = false,
		attendanceId = null, // NOTE: these can be either real or temp attendances (they are different object types)
		baseHeightPx = 50,
		tempUserName = null,
		numGuests = 0,
		showRemoveUser = true,
		showHistory = true,
		onlyShowPhoto = false
	} = $props();

	let url = $state();
	let fullsizeUrl = $state();
	let fallbackName = $state();
	let username = $state();
	let isTempUser: boolean = $state(true);
	let lastUpdatedAt: Date | null = $state(null);
	let fallbackNameShort: string | null = $state(null);
	let previousImageHash: string | null = $state(null); // Store the last known image hash

	let showRemoveAttendeeModal = $state(false);
	const eventId = $page.params.id;
	let dialogIsOpen = $state(false);

	let isVisible = $state(false);
	let avatarElement: any = $state();

	async function hashImage(imageBlob: Blob): Promise<string> {
		const buffer = await imageBlob.arrayBuffer();
		const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
		return Array.from(new Uint8Array(hashBuffer))
			.map((byte) => byte.toString(16).padStart(2, '0'))
			.join('');
	}

	const removeAttendee = async () => {
		if (
			(!viewerIsEventAdmin && attendanceId) ||
			($page.data.user && userId == $page.data.user.id)
		) {
			return;
		}
		try {
			const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

			if (isTempUser) {
				await removeTempAttendee(client, attendanceId, $page.data.user.id);
			} else {
				await removeRealAttendee(client, attendanceId, $page.data.user.id);
				await deleteUserLiveDataStoreEntry(userId);
			}

			dialogIsOpen = false;
			toast.success(`Deleted ${username ? username : 'attendee'} from event`);
		} catch (e) {
			toast.error(
				`Failed to remove attendee. Please contact support at ${publicEnv.PUBLIC_FROM_EMAIL} if it persists`
			);
			console.error(
				`failed to remove ${isTempUser ? 'temp' : 'full'} attendee from event with id ${eventId}`,
				e
			);
		} finally {
			// NOTE: if we don't set it back to true, I have observed that a new ProfileAvatar may open in delete mode. Not great UX experience.
			showRemoveAttendeeModal = false;
		}
	};

	const showRemoveUserModal = () => {
		showRemoveAttendeeModal = true;
	};

	const hideRemoveUserModal = () => {
		showRemoveAttendeeModal = false;
	};

	let previousUser: any = null; // Store the last known user state
	let unsubscribe: any; // Store unsubscribe function

	onMount(async () => {
		if (tempUserName) {
			fallbackNameShort = tempUserName?.slice(0, 2) ?? null;
			fallbackName = tempUserName;
			username = tempUserName;
			isTempUser = true;
			return;
		}

		if (!userId && !tempUserId) {
			return;
		}

		if (userId) {
			addUserRequest(userId);

			unsubscribe = usersLiveDataStore.subscribe((users) => {
				const user = users[userId];
				if (!user) return;

				// // Only update if the user object has changed
				// if (
				// 	!user ||
				// 	(JSON.stringify(user) === JSON.stringify(previousUser) &&
				// 		previousUser.profilePicUpdatedAt === user.profilePicUpdatedAt)
				// ) {
				// 	return;
				// }
				previousUser = user; // Update the reference

				fallbackNameShort = user?.username?.slice(0, 2) ?? null;
				fullsizeUrl = user?.fullProfilePicURL;
				fallbackName = user?.username;
				username = user?.username;
				isTempUser = user?.isTempUser ?? false;

				const lastUpdatedAtDate = user?.userUpdatedAt ? new Date(user?.userUpdatedAt) : null;
				lastUpdatedAt = lastUpdatedAtDate; // TODO: get latest of that or image updated at

				if (user?.smallProfilePic) {
					updateProfileImage(user.smallProfilePic);
				}
			});
		} else {
			unsubscribe = tempUsersLiveDataStore.subscribe((tempUsers) => {
				const tempUser = tempUsers.get(tempUserId);
				fallbackNameShort = tempUser?.username?.slice(0, 2) ?? null;
				fallbackName = tempUser?.username;
				username = tempUser?.username;
				isTempUser = true;
			});
		}

		return () => {
			if (unsubscribe) {
				unsubscribe();
			}
		};
	});

	onMount(() => {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach(
				(entry) => {
					if (entry.isIntersecting) {
						isVisible = true;
						observer.unobserve(entry.target);
					}
				},
				{
					rootMargin: '500px 0px 0px 0px' // Adjust the top margin to create a buffer region
				}
			);
		});
		if (avatarElement) {
			observer.observe(avatarElement);
		}

		return () => {
			if (avatarElement) {
				observer.unobserve(avatarElement);
			}
		};
	});

	const updateProfileImage = async (smallProfilePic: any) => {
		const newHash = await hashImage(smallProfilePic);

		// Only update if the hash is different
		if (newHash !== previousImageHash) {
			if (url) {
				URL.revokeObjectURL(url); // Free old memory
			}
			url = URL.createObjectURL(smallProfilePic);
			previousImageHash = newHash; // Store the new hash
		}
	};

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});
</script>

<div bind:this={avatarElement}>
	{#if isVisible}
		{#if onlyShowPhoto}
			<TriggerButton
				{username}
				{fallbackNameShort}
				{isTempUser}
				{fullsizeUrl}
				{url}
				{baseHeightPx}
				{numGuests}
			/>
		{:else}
			<Dialog.Root bind:open={dialogIsOpen}>
				<Dialog.Trigger
					class={`profile-avatar ${isTempUser ? 'temp-user' : ''} flex items-center justify-center focus:outline-none focus-visible:ring-0 h-full`}
				>
					<TriggerButton
						{username}
						{fallbackNameShort}
						{isTempUser}
						{fullsizeUrl}
						{url}
						{baseHeightPx}
						{numGuests}
					/>
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-[425px]">
					<Dialog.Header>
						{#if showRemoveAttendeeModal}
							<div class="space-y-8">
								<h1 class="text-xl font-bold">Are you absolutely sure?</h1>
								<p>
									This action cannot be undone. This will remove {username ? username : 'this user'}
									from this event.
								</p>
								<div class="space-y-2">
									<Button
										onclick={removeAttendee}
										class="flex w-full items-center justify-center bg-red-500 hover:bg-red-400"
									>
										Yes, remove</Button
									>
									<Button
										onclick={hideRemoveUserModal}
										class="flex w-full items-center justify-center "
									>
										Cancel</Button
									>
								</div>
							</div>
						{:else}
							<Dialog.Title class="flex items-center justify-center"
								>{username}
								{#if isTempUser}
									<div class="ml-2">
										<div class="rounded-lg bg-yellow-400 p-1 px-2 text-xs font-light text-black">
											temporary account
										</div>
									</div>
								{/if}
							</Dialog.Title>
							<Dialog.Description>
								{#if viewerIsEventAdmin && showHistory}
									<Tabs.Root value="about" class="mt-1 w-full">
										<div class="flex w-full justify-center">
											<Tabs.List>
												<Tabs.Trigger class="profile-about-tab" value="about">About</Tabs.Trigger>
												<Tabs.Trigger class="profile-history-tab" value="history"
													>History</Tabs.Trigger
												>
											</Tabs.List>
										</div>

										<Tabs.Content value="about">{@render content()}</Tabs.Content>
										<Tabs.Content value="history">
											<ProfileHistory attendeeId={attendanceId} {isTempUser} />
										</Tabs.Content>
									</Tabs.Root>
								{:else}
									{@render content()}
								{/if}
							</Dialog.Description>
						{/if}
					</Dialog.Header>

					<Dialog.Footer></Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
		{/if}
	{/if}
</div>

{#snippet content()}
	{#if lastUpdatedAt}
		<div class="flex justify-center">Last updated {formatHumanReadable(lastUpdatedAt)}</div>
	{/if}
	<div class="mt-3 flex w-full items-center justify-center text-3xl text-black md:text-4xl">
		{#if fullsizeUrl || url}
			<Avatar.Root class="mt-3 aspect-square h-fit w-fit">
				<Avatar.Image
					src={fullsizeUrl ? (fullsizeUrl as string) : (url as string)}
					alt={username as string}
				/>
				<Avatar.Fallback>{fallbackNameShort}</Avatar.Fallback>
				<!-- Overlay Layer for Temp User -->
			</Avatar.Root>
		{:else}
			<div class="relative">
				<GeneratedAvatar {username} size={200} />
				{#if isTempUser}
					<div class="pointer-events-none absolute inset-0 rounded-full border-8 border-yellow-400">
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
	{#if numGuests > 0}
		<div class="mt-2 flex w-full justify-center">
			<div class="rounded-xl bg-red-500/70 p-2 text-sm text-center text-white dark:bg-red-700/70">
				Bringing {numGuests} extra guest{numGuests > 1 ? 's' : ''} ({numGuests + 1} total including
				{username})
			</div>
		</div>
	{/if}
	<!-- TODO -->
	<!-- {#if userIsEventAdmin}
						<div class="mt-2 flex w-full justify-center">
							<div class="rounded-xl bg-slate-500 p-2 text-white dark:bg-slate-700">Admin</div>
						</div>
					{/if} -->
	{#if viewerIsEventAdmin && $page.data.user && userId != $page.data.user.id && showRemoveUser}
		<Button
			onclick={showRemoveUserModal}
			class="mt-4 flex w-full items-center justify-center bg-red-500 hover:bg-red-400"
		>
			<UserRoundMinus class="h-5 w-5" />
			Remove user from event</Button
		>
	{/if}
{/snippet}
