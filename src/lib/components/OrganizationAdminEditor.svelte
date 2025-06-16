<script lang="ts">
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { and, type TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';
	import Check from 'lucide-svelte/icons/check';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn, formatHumanReadable } from '$lib/utils.js';
	import { UserRoundMinus, UserRoundPlus, ChevronUp, ChevronDown, X } from 'lucide-svelte';
	import HorizRule from './HorizRule.svelte';
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card/index.js';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import ProfileAvatar from './profile/profile-avatar/ProfileAvatar.svelte';
	import { slide } from 'svelte/transition';
	import CollapsibleContent from './CollapsibleContent.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { updateOrganizationMemberRole, removeOrganizationMember } from '$lib/organizations';

	let { organizationId, currUserId, organizationCreatorId } = $props();

	let client: TriplitClient;
	let membersLoading = $state(true);

	let currentAdmins: any[] = $state([]);
	let currentEditors: any[] = $state([]);
	let currentMembers: any[] = $state([]);
	let selectedMember = $state<string | null>(null);
	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);
	let inputRef = $state<HTMLInputElement>(null!);

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromMembersQuery = client.subscribe(
			client
				.query('organization_members')
				.Where([
					and([
						['organization_id', '=', organizationId],
						['user_id', '!=', organizationCreatorId] // Exclude the organization creator
					])
				])
				.Include('user')
				.Include('added_by', (rel) => rel('added_by')),
			(results) => {
				// Separate members by role
				currentAdmins = results.filter((member) => member.role === 'admin');
				currentEditors = results.filter((member) => member.role === 'editor');
				currentMembers = results.filter((member) => member.role === 'member');

				// Sort by username
				currentAdmins.sort((a, b) => a.user.username.localeCompare(b.user.username));
				currentEditors.sort((a, b) => a.user.username.localeCompare(b.user.username));
				currentMembers.sort((a, b) => a.user.username.localeCompare(b.user.username));

				membersLoading = false;
			},
			(error) => {
				console.error('Error fetching organization members:', error);
				membersLoading = true;
			},
			{
				localOnly: false,
				onRemoteFulfilled: () => {
					membersLoading = false;
				}
			}
		);

		return () => {
			unsubscribeFromMembersQuery();
		};
	});

	async function promoteToAdmin(userId: string) {
		try {
			await updateOrganizationMemberRole(client, organizationId, userId, 'admin', currUserId);
			toast.success('Successfully promoted member to admin');
		} catch (error) {
			toast.error('Failed to promote member, please try again later or contact support');
			console.error('Error promoting member to admin:', error);
		}
	}

	async function promoteToEditor(userId: string) {
		try {
			await updateOrganizationMemberRole(client, organizationId, userId, 'editor', currUserId);
			toast.success('Successfully promoted member to editor');
		} catch (error) {
			toast.error('Failed to promote member, please try again later or contact support');
			console.error('Error promoting member to editor:', error);
		}
	}

	async function demoteToEditor(userId: string) {
		try {
			await updateOrganizationMemberRole(client, organizationId, userId, 'editor', currUserId);
			toast.success('Successfully demoted admin to editor');
		} catch (error) {
			toast.error('Failed to demote admin, please try again later or contact support');
			console.error('Error demoting admin to editor:', error);
		}
	}

	async function demoteToMember(userId: string) {
		try {
			await updateOrganizationMemberRole(client, organizationId, userId, 'member', currUserId);
			toast.success('Successfully demoted to member');
		} catch (error) {
			toast.error('Failed to demote member, please try again later or contact support');
			console.error('Error demoting to member:', error);
		}
	}

	async function removeMember(userId: string) {
		try {
			await removeOrganizationMember(client, organizationId, userId);
			toast.success('Successfully removed member from organization');
		} catch (error) {
			toast.error('Failed to remove member, please try again later or contact support');
			console.error('Error removing member:', error);
		}
	}

	// Synchronize input height with trigger button
	$effect(() => {
		resizeInputBox();
	});

	const resizeInputBox = () => {
		if (triggerRef && inputRef) {
			const triggerWidth = triggerRef.offsetWidth;
			inputRef.style.width = `${triggerWidth}px`;
		}
	};

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}

	function getRoleColor(role: string) {
		switch (role) {
			case 'admin':
				return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
			case 'editor':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
			case 'member':
				return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
		}
	}
</script>

<div class="mx-4 mb-16 flex flex-col items-center justify-center">
	<section class="w-full sm:w-[450px]">
		<h1
			class="mb-5 flex w-full justify-center rounded-xl bg-white p-2 text-lg font-semibold dark:bg-slate-900 dark:text-white"
		>
			Manage Organization Members
		</h1>

		<Collapsible.Root class="mb-5 rounded-lg bg-slate-200/80 dark:bg-slate-800/80 dark:text-white">
			<Collapsible.Trigger class="flex w-full items-center justify-between space-x-4 px-4">
				<div class="invisible"></div>
				<h4 class="text-sm font-semibold">What can different roles do?</h4>
				<Button variant="ghost" size="sm" class="w-9 p-0">
					<ChevronsUpDown />
					<span class="sr-only">Toggle</span>
				</Button>
			</Collapsible.Trigger>
			<CollapsibleContent duration={300}>
				<div transition:slide={{ duration: 300 }} class="py-3">
					<div class="mb-4">
						<div class="mb-2 px-4 text-sm font-medium text-red-600 dark:text-red-400">Admins</div>
						<ul class="ml-5 list-disc pl-5">
							<li class="rounded-md px-4 py-1 text-sm">Full organization management</li>
							<li class="rounded-md px-4 py-1 text-sm">Manage members and their roles</li>
							<li class="rounded-md px-4 py-1 text-sm">Admin access to all organization events</li>
							<li class="rounded-md px-4 py-1 text-sm">Edit organization details</li>
						</ul>
					</div>

					<div class="mb-4">
						<div class="mb-2 px-4 text-sm font-medium text-yellow-600 dark:text-yellow-400">
							Editors
						</div>
						<ul class="ml-5 list-disc pl-5">
							<li class="rounded-md px-4 py-1 text-sm">Create and manage events</li>
							<li class="rounded-md px-4 py-1 text-sm">Edit organization content</li>
							<li class="rounded-md px-4 py-1 text-sm">View all members</li>
						</ul>
					</div>

					<div class="mb-4">
						<div class="mb-2 px-4 text-sm font-medium text-green-600 dark:text-green-400">
							Members
						</div>
						<ul class="ml-5 list-disc pl-5">
							<li class="rounded-md px-4 py-1 text-sm">Participate in organization events</li>
							<li class="rounded-md px-4 py-1 text-sm">View organization information</li>
							<li class="rounded-md px-4 py-1 text-sm">Basic interaction permissions</li>
						</ul>
					</div>

					<div class="mt-5 flex justify-center px-4 text-sm font-semibold">Limitations</div>
					<ul class="ml-5 list-disc pl-5">
						<li class="rounded-md px-4 py-1 text-sm">
							Only organization creator can transfer ownership
						</li>
						<li class="rounded-md px-4 py-1 text-sm">Members cannot manage other members</li>
					</ul>
				</div>
			</CollapsibleContent>
		</Collapsible.Root>

		{#if membersLoading}
			<div class="flex justify-center p-8">
				<div class="text-sm text-gray-500 dark:text-gray-400">Loading members...</div>
			</div>
		{:else}
			<!-- Admins Section -->
			{#if currentAdmins.length > 0}
				<div class="mb-6">
					<h2
						class="mb-3 flex w-full justify-center rounded-xl bg-white p-2 text-lg font-semibold dark:bg-slate-900 dark:text-white"
					>
						Admins ({currentAdmins.length})
					</h2>
					<div class="space-y-3">
						{#each currentAdmins as admin (admin.user.id)}
							<Card.Root
								class="bg-red-50 dark:bg-red-950/20 dark:text-white dark:hover:bg-red-950/30"
							>
								<Card.Header>
									<Card.Title class="flex items-center justify-between">
										<div class="flex items-center">
											<ProfileAvatar userId={admin.user?.id} baseHeightPx={40} />
											<div class="ml-2">
												<span class="text-base">{admin.user.username}</span>
												<Badge class={getRoleColor('admin')} variant="secondary" size="sm">
													Admin
												</Badge>
											</div>
										</div>
									</Card.Title>
									<Card.Description>
										Added on {formatHumanReadable(admin.created_at)}
										{#if admin.added_by}
											by <span class="font-bold">
												{#if currUserId == admin.added_by_user_id}
													you
												{:else}
													{admin.added_by.username}
												{/if}
											</span>
										{/if}
									</Card.Description>
								</Card.Header>
								<Card.Footer class="flex justify-between">
									<Button variant="outline" size="sm" onclick={() => demoteToEditor(admin.user_id)}>
										<ChevronDown class="mr-1 h-4 w-4" />
										Demote to Editor
									</Button>
									<Button
										variant="destructive"
										size="sm"
										onclick={() => removeMember(admin.user_id)}
									>
										<UserRoundMinus class="mr-1 h-4 w-4" />
										Remove
									</Button>
								</Card.Footer>
							</Card.Root>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Editors Section -->
			{#if currentEditors.length > 0}
				<div class="mb-6">
					<h2
						class="mb-3 flex w-full justify-center rounded-xl bg-white p-2 text-lg font-semibold dark:bg-slate-900 dark:text-white"
					>
						Editors ({currentEditors.length})
					</h2>
					<div class="space-y-3">
						{#each currentEditors as editor (editor.user.id)}
							<Card.Root
								class="bg-yellow-50 dark:bg-yellow-950/20 dark:text-white dark:hover:bg-yellow-950/30"
							>
								<Card.Header>
									<Card.Title class="flex items-center justify-between">
										<div class="flex items-center">
											<ProfileAvatar userId={editor.user?.id} baseHeightPx={40} />
											<div class="ml-2">
												<span class="text-base">{editor.user.username}</span>
												<Badge class={getRoleColor('editor')} variant="secondary" size="sm">
													Editor
												</Badge>
											</div>
										</div>
									</Card.Title>
									<Card.Description>
										Added on {formatHumanReadable(editor.created_at)}
										{#if editor.added_by}
											by <span class="font-bold">
												{#if currUserId == editor.added_by_user_id}
													you
												{:else}
													{editor.added_by.username}
												{/if}
											</span>
										{/if}
									</Card.Description>
								</Card.Header>
								<Card.Footer class="flex justify-between">
									<div class="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											onclick={() => promoteToAdmin(editor.user_id)}
										>
											<ChevronUp class="mr-1 h-4 w-4" />
											Promote to Admin
										</Button>
										<Button
											variant="outline"
											size="sm"
											onclick={() => demoteToMember(editor.user_id)}
										>
											<ChevronDown class="mr-1 h-4 w-4" />
											Demote to Member
										</Button>
									</div>
									<Button
										variant="destructive"
										size="sm"
										onclick={() => removeMember(editor.user_id)}
									>
										<UserRoundMinus class="mr-1 h-4 w-4" />
										Remove
									</Button>
								</Card.Footer>
							</Card.Root>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Members Section -->
			{#if currentMembers.length > 0}
				<div class="mb-6">
					<h2
						class="mb-3 flex w-full justify-center rounded-xl bg-white p-2 text-lg font-semibold dark:bg-slate-900 dark:text-white"
					>
						Members ({currentMembers.length})
					</h2>
					<div class="space-y-3">
						{#each currentMembers as member (member.user.id)}
							<Card.Root
								class="bg-green-50 dark:bg-green-950/20 dark:text-white dark:hover:bg-green-950/30"
							>
								<Card.Header>
									<Card.Title class="flex items-center justify-between">
										<div class="flex items-center">
											<ProfileAvatar userId={member.user?.id} baseHeightPx={40} />
											<div class="ml-2">
												<span class="text-base">{member.user.username}</span>
												<Badge class={getRoleColor('member')} variant="secondary" size="sm">
													Member
												</Badge>
											</div>
										</div>
									</Card.Title>
									<Card.Description>
										Added on {formatHumanReadable(member.created_at)}
										{#if member.added_by}
											by <span class="font-bold">
												{#if currUserId == member.added_by_user_id}
													you
												{:else}
													{member.added_by.username}
												{/if}
											</span>
										{/if}
									</Card.Description>
								</Card.Header>
								<Card.Footer class="flex justify-between">
									<div class="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											onclick={() => promoteToEditor(member.user_id)}
										>
											<ChevronUp class="mr-1 h-4 w-4" />
											Promote to Editor
										</Button>
										<Button
											variant="outline"
											size="sm"
											onclick={() => promoteToAdmin(member.user_id)}
										>
											<ChevronUp class="mr-1 h-4 w-4" />
											Promote to Admin
										</Button>
									</div>
									<Button
										variant="destructive"
										size="sm"
										onclick={() => removeMember(member.user_id)}
									>
										<UserRoundMinus class="mr-1 h-4 w-4" />
										Remove
									</Button>
								</Card.Footer>
							</Card.Root>
						{/each}
					</div>
				</div>
			{/if}

			<!-- No Members State -->
			{#if currentAdmins.length === 0 && currentEditors.length === 0 && currentMembers.length === 0}
				<div class="mb-5 flex w-full justify-center">
					<div class="rounded-xl bg-white p-2 px-4 text-xs dark:bg-slate-700">
						No members yet besides the organization creator
					</div>
				</div>
			{/if}
		{/if}
	</section>
</div>
