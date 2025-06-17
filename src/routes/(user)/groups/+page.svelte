<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Plus, Users, Calendar, Globe, Settings, ExternalLink, Building2 } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	const { data } = $props();
	const { userGroups, user } = data;

	function getRoleColor(role: string) {
		switch (role) {
			case 'leader':
			case 'admin': // legacy support
				return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
			case 'event_manager':
			case 'editor': // legacy support
			case 'member': // legacy support
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
		}
	}

	function handleCreateGroup() {
		goto('/groups/create');
	}
</script>

<svelte:head>
	<title>Groups - Bonfire</title>
	<meta name="description" content="Manage your groups and create new ones" />
</svelte:head>

<div class="mx-4 mb-48 flex flex-col items-center justify-center sm:mb-20">
	<section class="mt-8 w-full sm:w-2/3 md:w-[700px]">
		<!-- Header -->
		<div class="mb-6">
			<h1 class="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Groups</h1>
			<p class="text-gray-600 dark:text-gray-400">
				Manage your groups and create events under their banner
			</p>
		</div>

		<!-- Create Group Action -->
		<div class="mb-6 flex w-full justify-center">
			<Button
				variant="outline"
				class="flex max-w-48 items-center gap-2"
				onclick={handleCreateGroup}
			>
				<Plus class="h-4 w-4" />
				Create Group
			</Button>
		</div>

		<!-- Groups List -->
		{#if userGroups.length > 0}
			<div class="space-y-6">
				<h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Your Groups</h2>

				<div class="space-y-4">
					{#each userGroups as org}
						<div
							class="rounded-lg bg-slate-200 p-6 transition-colors hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700"
						>
							<div class="mb-4 flex items-start justify-between">
								<div class="flex flex-1 items-center gap-3">
									{#if org.logo_url}
										<img
											src={org.logo_url}
											alt="{org.name} logo"
											class="h-12 w-12 rounded-lg object-cover"
										/>
									{:else}
										<div
											class="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold text-white"
										>
											{org.name.charAt(0).toUpperCase()}
										</div>
									{/if}
									<div class="min-w-0 flex-1">
										<h3 class="mb-1 truncate font-semibold text-gray-900 dark:text-white">
											{org.name}
										</h3>
										<div class="flex items-center gap-2">
											<Badge class={getRoleColor(org.userRole)} variant="secondary">
												{org.userRole === 'leader'
													? 'Group Leader'
													: org.userRole === 'event_manager'
														? 'Event Manager'
														: org.userRole}
											</Badge>
											{#if org.is_public}
												<Badge variant="outline" class="text-xs">
													<Globe class="mr-1 h-3 w-3" />
													Public
												</Badge>
											{/if}
										</div>
									</div>
								</div>
							</div>

							{#if org.description}
								<p class="mb-4 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
									{org.description}
								</p>
							{/if}

							<div
								class="mb-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400"
							>
								<span class="flex items-center gap-1">
									<Users class="h-4 w-4" />
									{org.memberCount || 0} members
								</span>
								<span class="flex items-center gap-1">
									<Calendar class="h-4 w-4" />
									{org.eventCount || 0} events
								</span>
							</div>

							<div class="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									onclick={() => goto(`/group/${org.id}`)}
									class="flex-1"
								>
									View Details
								</Button>
								{#if org.userRole === 'leader' || org.userRole === 'admin'}
									<Button
										variant="outline"
										size="sm"
										onclick={() => goto(`/group/${org.id}/settings`)}
									>
										<Settings class="h-4 w-4" />
									</Button>
								{/if}
								{#if org.website_url}
									<Button
										variant="outline"
										size="sm"
										onclick={() => window.open(org.website_url, '_blank')}
									>
										<ExternalLink class="h-4 w-4" />
									</Button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<!-- Empty State -->
			<div
				class="mx-auto mt-10 flex w-full max-w-sm flex-col items-center justify-center gap-2 space-y-5 rounded-lg bg-slate-200 p-6 text-center dark:bg-slate-800 dark:text-white sm:mt-16 sm:w-2/3"
			>
				<Building2 class="mx-auto h-16 w-16 text-gray-400" />
				<h3 class="text-lg font-semibold text-gray-900 dark:text-white">No groups yet</h3>
				<p class="text-gray-600 dark:text-gray-400">
					Create your first group to start grouping your events
				</p>
				<Button
					class="w-full text-sm dark:bg-slate-600 dark:text-white dark:hover:bg-slate-500"
					onclick={handleCreateGroup}
				>
					<Plus class="mr-2 h-4 w-4" />
					Create First Group
				</Button>
			</div>
		{/if}
	</section>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
