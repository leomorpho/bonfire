<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { ArrowLeft, UserX, Search } from 'lucide-svelte';
	import FadeIn from '$lib/components/containers/FadeIn.svelte';
	import BonfireNoInfoCard from '$lib/components/BonfireNoInfoCard.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import BlockUserCard from '$lib/components/settings/BlockUserCard.svelte';
	import BlockedUserCard from '$lib/components/settings/BlockedUserCard.svelte';
	import { toast } from 'svelte-sonner';

	let searchTerm = $state('');
	let availableUsers = $state([]);
	let blockedUsers = $state([]);
	let loading = $state(false);
	let error = $state('');
	let hasMore = $state(false);
	let page = $state(1);
	let activeTab = $state('blocked'); // 'blocked' or 'search'

	let searchTimeout;

	// Debounced search function
	const debouncedSearch = (query: string) => {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			searchUsers(query, 1);
		}, 300);
	};

	const searchUsers = async (query: string, pageNum: number) => {
		if (activeTab !== 'search') return;

		loading = true;
		error = '';

		try {
			const params = new URLSearchParams({
				q: query.trim(),
				page: pageNum.toString(),
				limit: '20'
			});

			const response = await fetch(`/api/users/search-connected?${params}`);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to search users');
			}

			availableUsers = data.users;
			hasMore = data.hasMore;
			page = pageNum;
		} catch (err) {
			error = err.message || 'Failed to search users';
			console.error('Search error:', err);
		} finally {
			loading = false;
		}
	};

	const loadBlockedUsers = async () => {
		loading = true;
		try {
			// Use Triplit to fetch blocked users with user details
			// For now, we'll use a simple API approach
			const response = await fetch('/api/users/blocked');
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to load blocked users');
			}

			blockedUsers = data.users;
		} catch (err) {
			error = err.message || 'Failed to load blocked users';
			console.error('Load blocked users error:', err);
		} finally {
			loading = false;
		}
	};

	const handleBlock = (userId: string) => {
		// Remove user from available users and add to blocked
		const blockedUser = availableUsers.find((u) => u.id === userId);
		if (blockedUser) {
			availableUsers = availableUsers.filter((u) => u.id !== userId);
			blockedUsers = [{ ...blockedUser, blocked_at: new Date() }, ...blockedUsers];
		}
	};

	const handleUnblock = (userId: string) => {
		blockedUsers = blockedUsers.filter((u) => u.id !== userId);
	};

	const loadNextPage = () => {
		if (!loading && hasMore && activeTab === 'search') {
			searchUsers(searchTerm, page + 1);
		}
	};

	const loadPreviousPage = () => {
		if (!loading && page > 1 && activeTab === 'search') {
			searchUsers(searchTerm, page - 1);
		}
	};

	// Watch for search term changes
	$effect(() => {
		if (activeTab === 'search') {
			debouncedSearch(searchTerm);
		}
	});

	// Load data when tab changes
	$effect(() => {
		if (activeTab === 'blocked') {
			loadBlockedUsers();
		} else if (activeTab === 'search' && searchTerm.trim()) {
			searchUsers(searchTerm, 1);
		}
	});

	onMount(() => {
		loadBlockedUsers();
	});
</script>

<FadeIn>
	<div class="mx-2 mb-10 flex flex-col items-center justify-center">
		<section class="mt-2 w-full px-5 sm:w-[450px]">
			<!-- Header -->
			<div class="mb-6 flex items-center space-x-4">
				<Button href="/settings" variant="ghost" size="sm">
					<ArrowLeft class="h-4 w-4" />
				</Button>
				<h2 class="text-2xl font-semibold">Block Users</h2>
			</div>

			<!-- Tabs -->
			<div class="mb-6 flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
				<button
					class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors {activeTab ===
					'blocked'
						? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
						: 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'}"
					onclick={() => (activeTab = 'blocked')}
				>
					<UserX class="mr-2 inline h-4 w-4" />
					Blocked Users ({blockedUsers.length})
				</button>
				<button
					class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors {activeTab ===
					'search'
						? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
						: 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'}"
					onclick={() => (activeTab = 'search')}
				>
					<Search class="mr-2 inline h-4 w-4" />
					Search to Block
				</button>
			</div>

			<!-- Search Input (only show for search tab) -->
			{#if activeTab === 'search'}
				<div class="mb-4">
					<Input
						type="text"
						placeholder="Search by username..."
						bind:value={searchTerm}
						class="w-full"
					/>
				</div>
			{/if}

			<!-- Error Message -->
			{#if error}
				<div
					class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
				>
					{error}
				</div>
			{/if}

			<!-- Content -->
			<div class="space-y-3">
				{#if activeTab === 'blocked'}
					<!-- Blocked Users List -->
					{#if loading}
						<!-- Loading skeleton for blocked users -->
						{#each Array(3) as _}
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
					{:else if blockedUsers.length > 0}
						{#each blockedUsers as user (user.id)}
							<BlockedUserCard {user} onUnblock={handleUnblock} />
						{/each}
					{:else}
						<BonfireNoInfoCard text="No blocked users" />
					{/if}
				{:else}
					<!-- Search Results -->
					{#if loading && availableUsers.length === 0}
						<!-- Loading skeleton for search -->
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
					{:else if availableUsers.length > 0}
						{#each availableUsers as user (user.id)}
							<BlockUserCard {user} onBlock={handleBlock} />
						{/each}

						<!-- Pagination Controls -->
						{#if (page > 1 || hasMore) && !loading}
							<div class="mt-4 flex items-center justify-center space-x-2">
								<Button
									variant="outline"
									size="sm"
									onclick={loadPreviousPage}
									disabled={page === 1}
								>
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
						{#if loading && availableUsers.length > 0}
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
						<BonfireNoInfoCard text={`No users found matching "${searchTerm}"`} />
					{:else if !loading}
						<BonfireNoInfoCard text="Search for users you've attended events with to block them." />
					{/if}
				{/if}
			</div>
		</section>
	</div>
</FadeIn>
