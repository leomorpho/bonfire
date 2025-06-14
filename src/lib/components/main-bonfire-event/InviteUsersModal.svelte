<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { clickOutside } from '$lib/actions/clickOutside';
	import InviteUserCard from './InviteUserCard.svelte';
	import BonfireNoInfoCard from '../BonfireNoInfoCard.svelte';
	import { Skeleton } from '../ui/skeleton';
	import { Button } from '../ui/button';
	import { Input } from '../ui/input';
	import { X, UserPlus } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let { isOpen = false, eventId, onClose } = $props();

	let searchTerm = $state('');
	let users = $state([]);
	let loading = $state(false);
	let error = $state('');
	let hasMore = $state(false);
	let page = $state(1);
	let invitingUsers = $state(new Set());
	let invitedUsers = $state(new Set());
	let scrollContainer;

	let searchTimeout;

	// Debounced search function
	const debouncedSearch = (query: string) => {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			searchUsers(query, 1);
		}, 300);
	};

	const searchUsers = async (query: string, pageNum: number) => {
		loading = true;
		error = '';

		try {
			const params = new URLSearchParams({
				q: query.trim(),
				eventId,
				page: pageNum.toString(),
				limit: '20'
			});

			const response = await fetch(`/api/users/search-connected?${params}`);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to search users');
			}

			// Filter out already invited users
			const filteredUsers = data.users.filter((user) => !invitedUsers.has(user.id));

			users = filteredUsers;
			hasMore = data.hasMore;
			page = pageNum;
		} catch (err) {
			error = err.message || 'Failed to search users';
			console.error('Search error:', err);
		} finally {
			loading = false;
		}
	};

	const loadNextPage = async () => {
		if (!loading && hasMore) {
			await searchUsers(searchTerm, page + 1);
			// Scroll to top of the user list
			if (scrollContainer) {
				scrollContainer.scrollTop = 0;
			}
		}
	};

	const loadPreviousPage = async () => {
		if (!loading && page > 1) {
			await searchUsers(searchTerm, page - 1);
			// Scroll to top of the user list
			if (scrollContainer) {
				scrollContainer.scrollTop = 0;
			}
		}
	};

	const handleInvite = async (userId: string) => {
		invitingUsers.add(userId);
		invitingUsers = invitingUsers; // Trigger reactivity

		try {
			const response = await fetch(`/api/events/${eventId}/invite`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ userId })
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to invite user');
			}

			// Mark user as invited and remove from list
			invitedUsers.add(userId);
			invitedUsers = invitedUsers;

			// Get username for toast before removing from list
			const invitedUser = users.find((u) => u.id === userId);

			// Remove user from current results
			users = users.filter((user) => user.id !== userId);

			// Show success toast
			toast.success(`Successfully invited ${invitedUser?.username || 'user'}`);
		} catch (err) {
			error = err.message || 'Failed to invite user';
			console.error('Invite error:', err);

			// Show error toast for specific errors
			if (err.message.includes('unpublished')) {
				toast.error('Cannot invite users to an unpublished event. Please publish the event first.');
			} else {
				toast.error(err.message || 'Failed to invite user');
			}
		} finally {
			invitingUsers.delete(userId);
			invitingUsers = invitingUsers;
		}
	};

	const handleUserBlocked = (userId: string) => {
		// Remove blocked user from current results
		users = users.filter((user) => user.id !== userId);
	};

	const handleClose = () => {
		if (onClose) {
			onClose();
		}
	};

	// Watch for search term changes
	$effect(() => {
		if (isOpen) {
			debouncedSearch(searchTerm);
		}
	});

	// Initial load when modal opens
	$effect(() => {
		if (isOpen) {
			searchUsers('', 1);
		}
	});

	// Reset state when modal closes
	$effect(() => {
		if (!isOpen) {
			searchTerm = '';
			users = [];
			error = '';
			invitingUsers.clear();
			invitedUsers.clear();
			page = 1;
			hasMore = false;
		}
	});
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900"
			transition:fly={{ y: 20, duration: 200 }}
			use:clickOutside={handleClose}
		>
			<!-- Header -->
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center space-x-2">
					<UserPlus class="h-5 w-5 text-blue-500" />
					<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Invite People</h2>
				</div>
				<Button variant="ghost" size="sm" onclick={handleClose}>
					<X class="h-4 w-4" />
				</Button>
			</div>

			<!-- Search Input -->
			<div class="mb-4">
				<Input
					type="text"
					placeholder="Search by username..."
					bind:value={searchTerm}
					class="w-full"
				/>
			</div>

			<!-- Error Message -->
			{#if error}
				<div
					class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
				>
					{error}
				</div>
			{/if}

			<!-- Results -->
			<div class="max-h-96 overflow-y-auto" bind:this={scrollContainer}>
				{#if loading && users.length === 0}
					<!-- Loading skeleton -->
					<div class="space-y-3">
						{#each Array(5) as _}
							<div class="flex items-center justify-between rounded-lg border p-3">
								<div class="flex items-center space-x-3">
									<Skeleton class="h-12 w-12 rounded-full" />
									<div class="space-y-2">
										<Skeleton class="h-4 w-24" />
										<Skeleton class="h-3 w-16" />
									</div>
								</div>
								<Skeleton class="h-8 w-16" />
							</div>
						{/each}
					</div>
				{:else if users.length > 0}
					<!-- User List -->
					<div class="space-y-2">
						{#each users as user (user.id)}
							<InviteUserCard
								{user}
								{eventId}
								onInvite={handleInvite}
								isInviting={invitingUsers.has(user.id)}
								onUserBlocked={handleUserBlocked}
							/>
						{/each}
					</div>

					<!-- Pagination Controls -->
					{#if (page > 1 || hasMore) && !loading}
						<div class="mt-4 flex items-center justify-center space-x-2">
							<Button variant="outline" size="sm" onclick={loadPreviousPage} disabled={page === 1}>
								Previous
							</Button>
							<span class="px-3 text-sm text-gray-600 dark:text-gray-400">
								Page {page}
							</span>
							<Button variant="outline" size="sm" onclick={loadNextPage} disabled={!hasMore}>
								Next
							</Button>
						</div>
					{/if}

					<!-- Loading indicator -->
					{#if loading && users.length > 0}
						<div class="mt-4 text-center">
							<div class="inline-flex items-center space-x-2 text-sm text-gray-500">
								<div
									class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
								></div>
								<span>Loading...</span>
							</div>
						</div>
					{/if}
				{:else if searchTerm.trim() && !loading}
					<!-- No results -->
					<BonfireNoInfoCard text={`No users found matching "${searchTerm}"`} />
				{:else if !loading}
					<!-- No connected users -->
					<BonfireNoInfoCard
						text="No connected users found. Users you've attended events with will appear here."
					/>
				{/if}
			</div>
		</div>
	</div>
{/if}
