<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Plus, Users, Calendar, Globe, Settings, ExternalLink } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	const { data } = $props();
	const { userOrganizations, user } = data;

	function getRoleColor(role: string) {
		switch (role) {
			case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
			case 'editor': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
			case 'member': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
			default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
		}
	}

	function handleCreateOrganization() {
		// TODO: Navigate to organization creation page when implemented
		goto('/organizations/create');
	}
</script>

<svelte:head>
	<title>Organizations - Bonfire</title>
	<meta name="description" content="Manage your organizations and create new ones" />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<div class="container mx-auto px-4 py-8 max-w-4xl">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Organizations</h1>
			<p class="text-gray-600 dark:text-gray-400">
				Manage your organizations and create events under their banner
			</p>
		</div>

		<!-- Create Organization Card -->
		<Card class="mb-8">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Plus class="w-5 h-5" />
					Create New Organization
				</CardTitle>
				<CardDescription>
					Start a new organization to group your events together
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button onclick={handleCreateOrganization} class="flex items-center gap-2">
					<Plus class="w-4 h-4" />
					Create Organization
				</Button>
			</CardContent>
		</Card>

		<!-- Organizations List -->
		{#if userOrganizations.length > 0}
			<div class="space-y-6">
				<h2 class="text-xl font-semibold text-gray-900 dark:text-white">Your Organizations</h2>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					{#each userOrganizations as org}
						<Card class="hover:shadow-lg transition-shadow">
							<CardHeader>
								<div class="flex items-start justify-between">
									<div class="flex items-center gap-3 flex-1">
										{#if org.logo_url}
											<img 
												src={org.logo_url} 
												alt="{org.name} logo"
												class="w-12 h-12 rounded-lg object-cover"
											/>
										{:else}
											<div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-lg font-bold">
												{org.name.charAt(0).toUpperCase()}
											</div>
										{/if}
										<div class="flex-1 min-w-0">
											<h3 class="font-semibold text-gray-900 dark:text-white truncate">
												{org.name}
											</h3>
											<div class="flex items-center gap-2 mt-1">
												<Badge class={getRoleColor(org.userRole)} variant="secondary">
													{org.userRole}
												</Badge>
												{#if org.is_public}
													<Badge variant="outline" class="text-xs">
														<Globe class="w-3 h-3 mr-1" />
														Public
													</Badge>
												{/if}
											</div>
										</div>
									</div>
								</div>
								
								{#if org.description}
									<CardDescription class="line-clamp-2">
										{org.description}
									</CardDescription>
								{/if}
							</CardHeader>
							
							<CardContent class="pt-0">
								<div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
									<span class="flex items-center gap-1">
										<Users class="w-4 h-4" />
										{org.memberCount || 0} members
									</span>
									<span class="flex items-center gap-1">
										<Calendar class="w-4 h-4" />
										{org.eventCount || 0} events
									</span>
								</div>
								
								<div class="flex gap-2">
									<Button 
										variant="outline" 
										size="sm" 
										onclick={() => goto(`/org/${org.id}`)}
										class="flex-1"
									>
										View Details
									</Button>
									{#if org.userRole === 'admin'}
										<Button 
											variant="outline" 
											size="sm"
											onclick={() => goto(`/org/${org.id}/settings`)}
										>
											<Settings class="w-4 h-4" />
										</Button>
									{/if}
									{#if org.website_url}
										<Button 
											variant="outline" 
											size="sm"
											onclick={() => window.open(org.website_url, '_blank')}
										>
											<ExternalLink class="w-4 h-4" />
										</Button>
									{/if}
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			</div>
		{:else}
			<!-- Empty State -->
			<Card>
				<CardContent class="text-center py-12">
					<Users class="w-16 h-16 text-gray-400 mx-auto mb-4" />
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
						No organizations yet
					</h3>
					<p class="text-gray-600 dark:text-gray-400 mb-6">
						Create your first organization to start grouping your events
					</p>
					<Button onclick={handleCreateOrganization} class="flex items-center gap-2">
						<Plus class="w-4 h-4" />
						Create First Organization
					</Button>
				</CardContent>
			</Card>
		{/if}
	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>