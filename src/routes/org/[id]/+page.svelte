<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		Calendar,
		MapPin,
		Users,
		Settings,
		Plus,
		ExternalLink,
		Globe,
		Clock
	} from 'lucide-svelte';
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
			case 'admin':
				return 'bg-red-100 text-red-800';
			case 'editor':
				return 'bg-yellow-100 text-yellow-800';
			case 'member':
				return 'bg-green-100 text-green-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}
</script>

<!-- <svelte:head>
	<title>{organization.name}</title>
	<meta name="description" content={organization.description || `Events and activities by ${organization.name}`} />
</svelte:head> -->

<div class="mx-4 mb-48 flex flex-col items-center justify-center sm:mb-20">
	<section class="mt-8 w-full sm:w-2/3 md:w-[700px] lg:w-[900px] xl:w-[1000px]">
		<!-- Organization Header -->
		<div class="mb-8 rounded-lg bg-slate-200 p-8 dark:bg-slate-800">
			<div class="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
				<div class="flex-1">
					<div class="mb-4 flex items-center gap-3">
						{#if organization.logo_url}
							<img
								src={organization.logo_url}
								alt="{organization.name} logo"
								class="h-16 w-16 rounded-lg object-cover"
							/>
						{:else}
							<div
								class="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-bold text-white"
							>
								{organization.name.charAt(0).toUpperCase()}
							</div>
						{/if}
						<div>
							<h1 class="text-3xl font-bold text-gray-900 dark:text-white">{organization.name}</h1>
							{#if organization.is_public}
								<Badge variant="outline" class="mt-1">
									<Globe class="mr-1 h-3 w-3" />
									Public Organization
								</Badge>
							{/if}
						</div>
					</div>

					{#if organization.description}
						<p class="mb-4 text-lg text-gray-600 dark:text-gray-300">{organization.description}</p>
					{/if}

					<div class="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
						{#if organization.website_url}
							<a
								href={organization.website_url}
								target="_blank"
								rel="noopener noreferrer"
								class="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
							>
								<ExternalLink class="h-4 w-4" />
								Website
							</a>
						{/if}
						<span class="flex items-center gap-1">
							<Users class="h-4 w-4" />
							{organization.members?.length || 0} members
						</span>
						<span class="flex items-center gap-1">
							<Calendar class="h-4 w-4" />
							{futureEvents.length + pastEvents.length} events
						</span>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="flex flex-col gap-3">
					{#if user}
						{#if canManage}
							<Button variant="outline" class="flex items-center gap-2">
								<Settings class="h-4 w-4" />
								Manage Organization
							</Button>
						{/if}

						{#if isMember}
							<Button onclick={() => goto('/bonfire/create')} class="flex items-center gap-2">
								<Plus class="h-4 w-4" />
								Create Event
							</Button>
							<Badge class={getRoleColor(userRole)} variant="secondary">
								{userRole?.charAt(0).toUpperCase()}{userRole?.slice(1)}
							</Badge>
						{:else if isViewer}
							<Badge variant="secondary" class="bg-blue-100 text-blue-800">Viewer</Badge>
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
					<Button
						class="w-2/3 bg-blue-600 hover:bg-blue-500 dark:bg-blue-700 dark:text-white dark:hover:bg-blue-600"
					>
						📷 Set a banner image
					</Button>
				</a>
			</div>
		{/if}

		<div class="space-y-8">
			<!-- Events Section -->
			<div class="space-y-6">
				<!-- Future Events -->
				{#if futureEvents.length > 0}
					<div class="rounded-lg bg-slate-200 p-6 dark:bg-slate-800">
						<h2
							class="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white"
						>
							<Calendar class="h-5 w-5" />
							Upcoming Events ({futureEvents.length})
						</h2>
						<div class="space-y-4">
							{#each futureEvents as event}
								<div
									class="rounded-lg border border-slate-300 p-4 transition-colors hover:bg-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
								>
									<div class="flex items-start justify-between">
										<div class="flex-1">
											<h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
												<a
													href="/bonfire/{event.id}"
													class="hover:text-blue-600 dark:hover:text-blue-400"
												>
													{event.title}
												</a>
											</h3>

											<div
												class="mb-2 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300"
											>
												<span class="flex items-center gap-1">
													<Clock class="h-4 w-4" />
													{formatEventDate(event.start_time)}
												</span>
												{#if event.location}
													<span class="flex items-center gap-1">
														<MapPin class="h-4 w-4" />
														{event.location}
													</span>
												{/if}
											</div>

											{#if event.description}
												<p class="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
													{event.description}
												</p>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Past Events -->
				{#if pastEvents.length > 0}
					<div class="rounded-lg bg-slate-200 p-6 dark:bg-slate-800">
						<h2
							class="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white"
						>
							<Clock class="h-5 w-5" />
							Past Events ({pastEvents.length})
						</h2>
						<div class="space-y-4">
							{#each pastEvents.slice(0, 5) as event}
								<div
									class="rounded-lg border border-slate-300 p-4 opacity-75 transition-opacity hover:opacity-100 dark:border-slate-600"
								>
									<div class="flex items-start justify-between">
										<div class="flex-1">
											<h3 class="mb-2 font-semibold text-gray-900 dark:text-white">
												<a
													href="/bonfire/{event.id}"
													class="hover:text-blue-600 dark:hover:text-blue-400"
												>
													{event.title}
												</a>
											</h3>

											<div class="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
												<span class="flex items-center gap-1">
													<Clock class="h-4 w-4" />
													{formatEventDate(event.start_time)}
												</span>
												{#if event.location}
													<span class="flex items-center gap-1">
														<MapPin class="h-4 w-4" />
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
								<div class="pt-4 text-center">
									<Button variant="outline" size="sm">
										Show {pastEvents.length - 5} more past events
									</Button>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- No Events State -->
				{#if futureEvents.length === 0 && pastEvents.length === 0}
					<div
						class="mx-auto mt-10 flex w-full max-w-sm flex-col items-center justify-center gap-2 space-y-5 rounded-lg bg-slate-200 p-6 text-center dark:bg-slate-800 dark:text-white sm:mt-16 sm:w-2/3"
					>
						<Calendar class="mx-auto h-12 w-12 text-gray-400" />
						<h3 class="text-lg font-semibold text-gray-900 dark:text-white">No events yet</h3>
						<p class="text-gray-600 dark:text-gray-400">
							This organization hasn't created any events yet.
						</p>
						{#if isMember}
							<Button
								class="w-full text-sm dark:bg-slate-600 dark:text-white dark:hover:bg-slate-500"
								onclick={() => goto('/bonfire/create')}
							>
								<Plus class="mr-2 h-4 w-4" />
								Create First Event
							</Button>
						{/if}
					</div>
				{/if}

				<!-- Members Section -->
				{#if organization.members && organization.members.length > 0}
					<div class="rounded-lg bg-slate-200 p-6 dark:bg-slate-800">
						<h2
							class="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white"
						>
							<Users class="h-5 w-5" />
							Members ({organization.members.length})
						</h2>
						<div class="space-y-3">
							{#each organization.members.slice(0, 10) as member}
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-3">
										<div
											class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium dark:bg-gray-700"
										>
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
								<div class="pt-2 text-center">
									<Button variant="link" size="sm" class="text-xs">
										Show {organization.members.length - 10} more members
									</Button>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Organization Info -->
				<div class="rounded-lg bg-slate-200 p-6 dark:bg-slate-800">
					<h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">About</h2>
					<div class="space-y-3 text-sm">
						<div>
							<span class="font-medium text-gray-900 dark:text-white">Created:</span>
							<span class="ml-2 text-gray-600 dark:text-gray-400">
								{format(new Date(organization.created_at), 'MMM d, yyyy')}
							</span>
						</div>

						<div>
							<span class="font-medium text-gray-900 dark:text-white">Founded by:</span>
							<span class="ml-2 text-gray-600 dark:text-gray-400">
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
									class="ml-2 text-blue-600 hover:underline dark:text-blue-400"
								>
									{new URL(organization.website_url).hostname}
								</a>
							</div>
						{/if}

						<div>
							<span class="font-medium text-gray-900 dark:text-white">Visibility:</span>
							<span class="ml-2 text-gray-600 dark:text-gray-400">
								{organization.is_public ? 'Public' : 'Private'}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
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
