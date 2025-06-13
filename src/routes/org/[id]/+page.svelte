<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Calendar, MapPin, Users, Settings, Plus, ExternalLink, Globe, Clock } from 'lucide-svelte';
	import { formatDistanceToNow, format } from 'date-fns';
	import { goto } from '$app/navigation';
	import OrganizationBanner from '$lib/components/organization/OrganizationBanner.svelte';

	const { data } = $props();
	const { organization, futureEvents, pastEvents, userRole, isViewer, user, bannerInfo } = data;

	// User permissions
	const isAdmin = userRole === 'admin';
	const isMember = !!userRole;
	const canManage = isAdmin || organization.created_by_user_id === user?.id;

	function formatEventDate(dateString: string) {
		const date = new Date(dateString);
		return format(date, 'MMM d, yyyy • h:mm a');
	}

	function getTimeStatus(dateString: string) {
		const date = new Date(dateString);
		const now = new Date();
		
		if (date < now) {
			return { text: formatDistanceToNow(date, { addSuffix: true }), isPast: true };
		} else {
			return { text: formatDistanceToNow(date, { addSuffix: true }), isPast: false };
		}
	}

	function getRoleColor(role: string) {
		switch (role) {
			case 'admin': return 'bg-red-100 text-red-800';
			case 'editor': return 'bg-yellow-100 text-yellow-800';
			case 'member': return 'bg-green-100 text-green-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}
</script>

<!-- <svelte:head>
	<title>{organization.name}</title>
	<meta name="description" content={organization.description || `Events and activities by ${organization.name}`} />
</svelte:head> -->

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<div class="container mx-auto px-4 py-8 max-w-6xl">
		<!-- Organization Header -->
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-8 mb-8">
			<div class="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
				<div class="flex-1">
					<div class="flex items-center gap-3 mb-4">
						{#if organization.logo_url}
							<img 
								src={organization.logo_url} 
								alt="{organization.name} logo"
								class="w-16 h-16 rounded-lg object-cover"
							/>
						{:else}
							<div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
								{organization.name.charAt(0).toUpperCase()}
							</div>
						{/if}
						<div>
							<h1 class="text-3xl font-bold text-gray-900 dark:text-white">{organization.name}</h1>
							{#if organization.is_public}
								<Badge variant="outline" class="mt-1">
									<Globe class="w-3 h-3 mr-1" />
									Public Organization
								</Badge>
							{/if}
						</div>
					</div>

					{#if organization.description}
						<p class="text-gray-600 dark:text-gray-300 text-lg mb-4">{organization.description}</p>
					{/if}

					<div class="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
						{#if organization.website_url}
							<a 
								href={organization.website_url} 
								target="_blank" 
								rel="noopener noreferrer"
								class="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
							>
								<ExternalLink class="w-4 h-4" />
								Website
							</a>
						{/if}
						<span class="flex items-center gap-1">
							<Users class="w-4 h-4" />
							{organization.members?.length || 0} members
						</span>
						<span class="flex items-center gap-1">
							<Calendar class="w-4 h-4" />
							{futureEvents.length + pastEvents.length} events
						</span>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="flex flex-col gap-3">
					{#if user}
						{#if canManage}
							<Button variant="outline" class="flex items-center gap-2">
								<Settings class="w-4 h-4" />
								Manage Organization
							</Button>
						{/if}
						
						{#if isMember}
							<Button onclick={() => goto('/bonfire/create')} class="flex items-center gap-2">
								<Plus class="w-4 h-4" />
								Create Event
							</Button>
							<Badge class={getRoleColor(userRole)} variant="secondary">
								{userRole?.charAt(0).toUpperCase()}{userRole?.slice(1)}
							</Badge>
						{:else if isViewer}
							<Badge variant="secondary" class="bg-blue-100 text-blue-800">
								Viewer
							</Badge>
						{/if}
					{/if}
				</div>
			</div>
		</div>

		<!-- Organization Banner -->
		{#if bannerInfo && bannerInfo.bannerIsSet}
			<div class="mb-8">
				<OrganizationBanner
					bannerSmallSizeUrl={bannerInfo.bannerSmallSizeUrl}
					bannerLargeSizeUrl={bannerInfo.bannerLargeSizeUrl}
					blurhash={bannerInfo.bannerBlurHash}
					unsplashAuthorName={bannerInfo.unsplashAuthorName}
					unsplashAuthorUsername={bannerInfo.unsplashAuthorUsername}
					isCurrentUserOrgAdmin={canManage}
					organizationId={organization.id}
				/>
			</div>
		{:else if canManage}
			<div class="mb-8 flex w-full justify-center">
				<a class="flex w-full justify-center" href="/org/{organization.id}/banner/edit">
					<Button class="w-2/3 bg-blue-600 hover:bg-blue-500 dark:bg-blue-700 dark:text-white dark:hover:bg-blue-600">
						📷 Set a banner image
					</Button>
				</a>
			</div>
		{/if}

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Events Section -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Future Events -->
				{#if futureEvents.length > 0}
					<Card>
						<CardHeader>
							<CardTitle class="flex items-center gap-2">
								<Calendar class="w-5 h-5" />
								Upcoming Events ({futureEvents.length})
							</CardTitle>
						</CardHeader>
						<CardContent class="space-y-4">
							{#each futureEvents as event}
								<div class="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
									<div class="flex items-start justify-between">
										<div class="flex-1">
											<h3 class="font-semibold text-lg text-gray-900 dark:text-white mb-2">
												<a href="/bonfire/{event.id}" class="hover:text-blue-600 dark:hover:text-blue-400">
													{event.title}
												</a>
											</h3>
											
											<div class="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300 mb-2">
												<span class="flex items-center gap-1">
													<Clock class="w-4 h-4" />
													{formatEventDate(event.start_time)}
												</span>
												{#if event.location}
													<span class="flex items-center gap-1">
														<MapPin class="w-4 h-4" />
														{event.location}
													</span>
												{/if}
											</div>

											{#if event.description}
												<p class="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
													{event.description}
												</p>
											{/if}
										</div>
										
										<!-- <div class="text-right">
											{@const timeStatus = getTimeStatus(event.start_time)}
											<span class="text-sm {timeStatus.isPast ? 'text-gray-500' : 'text-green-600 dark:text-green-400'}">
												{timeStatus.text}
											</span>
											{#if event.private_data}
												<div class="text-xs text-gray-500 mt-1">
													{event.private_data.num_attendees_going || 0} going
												</div>
											{/if}
										</div> -->
									</div>
								</div>
							{/each}
						</CardContent>
					</Card>
				{/if}

				<!-- Past Events -->
				{#if pastEvents.length > 0}
					<Card>
						<CardHeader>
							<CardTitle class="flex items-center gap-2">
								<Clock class="w-5 h-5" />
								Past Events ({pastEvents.length})
							</CardTitle>
						</CardHeader>
						<CardContent class="space-y-4">
							{#each pastEvents.slice(0, 5) as event}
								<div class="border rounded-lg p-4 opacity-75 hover:opacity-100 transition-opacity">
									<div class="flex items-start justify-between">
										<div class="flex-1">
											<h3 class="font-semibold text-gray-900 dark:text-white mb-2">
												<a href="/bonfire/{event.id}" class="hover:text-blue-600 dark:hover:text-blue-400">
													{event.title}
												</a>
											</h3>
											
											<div class="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
												<span class="flex items-center gap-1">
													<Clock class="w-4 h-4" />
													{formatEventDate(event.start_time)}
												</span>
												{#if event.location}
													<span class="flex items-center gap-1">
														<MapPin class="w-4 h-4" />
														{event.location}
													</span>
												{/if}
											</div>
										</div>
										
										{#if event.private_data}
											<div class="text-right text-xs text-gray-500">
												{event.private_data.num_attendees_going || 0} attended
											</div>
										{/if}
									</div>
								</div>
							{/each}
							
							{#if pastEvents.length > 5}
								<div class="text-center pt-4">
									<Button variant="outline" size="sm">
										Show {pastEvents.length - 5} more past events
									</Button>
								</div>
							{/if}
						</CardContent>
					</Card>
				{/if}

				<!-- No Events State -->
				{#if futureEvents.length === 0 && pastEvents.length === 0}
					<Card>
						<CardContent class="text-center py-12">
							<Calendar class="w-12 h-12 text-gray-400 mx-auto mb-4" />
							<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No events yet</h3>
							<p class="text-gray-600 dark:text-gray-400 mb-4">
								This organization hasn't created any events yet.
							</p>
							{#if isMember}
								<Button onclick={() => goto('/bonfire/create')} class="flex items-center gap-2">
									<Plus class="w-4 h-4" />
									Create First Event
								</Button>
							{/if}
						</CardContent>
					</Card>
				{/if}
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Members Section -->
				{#if organization.members && organization.members.length > 0}
					<Card>
						<CardHeader>
							<CardTitle class="flex items-center gap-2">
								<Users class="w-5 h-5" />
								Members ({organization.members.length})
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="space-y-3">
								{#each organization.members.slice(0, 10) as member}
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-3">
											<div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-medium">
												{member.user?.username?.charAt(0).toUpperCase() || '?'}
											</div>
											<span class="text-sm font-medium text-gray-900 dark:text-white">
												{member.user?.username || 'Unknown User'}
											</span>
										</div>
										<Badge variant="outline" class={getRoleColor(member.role)} size="sm">
											{member.role}
										</Badge>
									</div>
								{/each}
								
								{#if organization.members.length > 10}
									<div class="text-center pt-2">
										<Button variant="link" size="sm" class="text-xs">
											Show {organization.members.length - 10} more members
										</Button>
									</div>
								{/if}
							</div>
						</CardContent>
					</Card>
				{/if}

				<!-- Organization Info -->
				<Card>
					<CardHeader>
						<CardTitle>About</CardTitle>
					</CardHeader>
					<CardContent class="space-y-3 text-sm">
						<div>
							<span class="font-medium text-gray-900 dark:text-white">Created:</span>
							<span class="text-gray-600 dark:text-gray-400 ml-2">
								{format(new Date(organization.created_at), 'MMM d, yyyy')}
							</span>
						</div>
						
						<div>
							<span class="font-medium text-gray-900 dark:text-white">Founded by:</span>
							<span class="text-gray-600 dark:text-gray-400 ml-2">
								{organization.creator?.username || 'Unknown'}
							</span>
						</div>

						{#if organization.website_url}
							<div>
								<span class="font-medium text-gray-900 dark:text-white">Website:</span>
								<a 
									href={organization.website_url} 
									target="_blank" 
									rel="noopener noreferrer"
									class="text-blue-600 dark:text-blue-400 hover:underline ml-2"
								>
									{new URL(organization.website_url).hostname}
								</a>
							</div>
						{/if}

						<div>
							<span class="font-medium text-gray-900 dark:text-white">Visibility:</span>
							<span class="text-gray-600 dark:text-gray-400 ml-2">
								{organization.is_public ? 'Public' : 'Private'}
							</span>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
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