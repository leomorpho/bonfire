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
	import { Input } from '$lib/components/ui/input/index.js';
	import { cn, formatHumanReadable } from '$lib/utils.js';
	import {
		UserRoundMinus,
		UserRoundPlus,
		ChevronUp,
		ChevronDown,
		Mail,
		ArrowLeft,
		Search,

		UserPlus

	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card/index.js';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import ProfileAvatar from '$lib/components/profile/profile-avatar/ProfileAvatar.svelte';
	import { slide } from 'svelte/transition';
	import CollapsibleContent from '$lib/components/CollapsibleContent.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import {
		updateGroupMemberRole,
		removeGroupMember,
		addGroupMember,
		approveGroupJoinRequest,
		rejectGroupJoinRequest
	} from '$lib/groups';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { goto } from '$app/navigation';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';

	const { data } = $props();
	const { group, members: initialMembers, userRole, user } = data;

	let client: TriplitClient;
	let membersLoading = $state(true);
	let searchLoading = $state(false);
	let emailInviteLoading = $state(false);

	// Member management state
	let currentLeaders: any[] = $state([]);
	let currentEventManagers: any[] = $state([]);
	let currentMembers: any[] = $state([]);

	// Join requests state
	let joinRequests: any[] = $state([]);
	let joinRequestsLoading = $state(true);

	// User search state
	let searchQuery = $state('');
	let searchResults: any[] = $state([]);
	let selectedUser = $state<any>(null);
	let selectedRole = $state<'leader' | 'event_manager' | 'member'>('member');

	// Email invite state
	let inviteEmail = $state('');
	let inviteRole = $state<'leader' | 'event_manager' | 'member'>('member');

	// Role options for dropdowns
	const roleOptions = [
		{ value: 'member', label: 'Member' },
		{ value: 'event_manager', label: 'Event Manager' },
		{ value: 'leader', label: 'Group Leader' }
	];

	// Derived content for selects
	const inviteRoleTriggerContent = $derived(
		roleOptions.find((r) => r.value === inviteRole)?.label ?? 'Select role'
	);

	const selectedRoleTriggerContent = $derived(
		roleOptions.find((r) => r.value === selectedRole)?.label ?? 'Select role'
	);

	// Search dropdown state
	let searchOpen = $state(false);
	let searchTriggerRef = $state<HTMLButtonElement>(null!);
	let searchInputRef = $state<HTMLInputElement>(null!);

	// Confirmation dialog state
	let confirmationDialog = $state({
		open: false,
		title: '',
		description: '',
		action: () => {},
		destructive: false
	});

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromMembersQuery = client.subscribe(
			client
				.query('group_members')
				.Where([['group_id', '=', group.id]])
				.Include('user')
				.Include('added_by', (rel) => rel('added_by')),
			(results) => {
				// Filter out members without loaded user data and separate by role
				const validMembers = results.filter((member) => member.user && member.user.id);

				currentLeaders = validMembers.filter(
					(member) => member.role === 'leader' || member.role === 'admin'
				); // Support legacy 'admin' role
				currentEventManagers = validMembers.filter(
					(member) => member.role === 'event_manager' || member.role === 'editor'
				); // Support legacy roles
				currentMembers = validMembers.filter((member) => member.role === 'member');

				// Sort by username
				currentLeaders.sort((a, b) => a.user.username.localeCompare(b.user.username));
				currentEventManagers.sort((a, b) => a.user.username.localeCompare(b.user.username));
				currentMembers.sort((a, b) => a.user.username.localeCompare(b.user.username));

				membersLoading = false;
			},
			(error) => {
				console.error('Error fetching group members:', error);
				membersLoading = true;
			},
			{
				localOnly: false,
				onRemoteFulfilled: () => {
					membersLoading = false;
				}
			}
		);

		// Subscribe to join requests
		const unsubscribeFromJoinRequestsQuery = client.subscribe(
			client
				.query('group_join_requests')
				.Where([['group_id', '=', group.id]])
				.Include('user')
				.Include('reviewed_by'),
			(results) => {
				joinRequests = results.filter((request) => request.user && request.user.id);
				joinRequests.sort(
					(a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
				);
				joinRequestsLoading = false;
			},
			(error) => {
				console.error('Error fetching join requests:', error);
				joinRequestsLoading = true;
			},
			{
				localOnly: false,
				onRemoteFulfilled: () => {
					joinRequestsLoading = false;
				}
			}
		);

		return () => {
			unsubscribeFromMembersQuery();
			unsubscribeFromJoinRequestsQuery();
		};
	});

	// Search users functionality
	async function searchUsers() {
		if (!searchQuery.trim()) {
			searchResults = [];
			return;
		}

		console.log('🔍 Searching for:', searchQuery);
		searchLoading = true;
		try {
			const url = `/api/users/search-connected?q=${encodeURIComponent(searchQuery)}&limit=10`;
			const response = await fetch(url);
			const data = await response.json();
			console.log('📡 API Response:', {
				status: response.status,
				users: data.users?.length || 0,
				data
			});

			if (response.ok && data.users) {
				// Filter out users who are already members
				const existingMemberIds = [
					...currentLeaders,
					...currentEventManagers,
					...currentMembers
				].map((m) => m.user_id);
				const filteredUsers = data.users.filter((user) => !existingMemberIds.includes(user.id));
				console.log(
					'✅ Found users:',
					filteredUsers.length,
					'after filtering out',
					existingMemberIds.length,
					'existing members'
				);
				searchResults = filteredUsers;
			} else {
				console.log('❌ API error:', response.status, data);
				searchResults = [];
				toast.error(data.error || 'Failed to search users');
			}
		} catch (error) {
			console.error('💥 Search error:', error);
			searchResults = [];
			toast.error('Failed to search users');
		} finally {
			searchLoading = false;
		}
	}

	// Debounced search - watch searchQuery changes
	let searchTimeout: NodeJS.Timeout;
	$effect(() => {
		// Clear previous timeout
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		// Only search if there's a query
		if (searchQuery.trim()) {
			searchTimeout = setTimeout(() => {
				searchUsers();
			}, 300);
		} else {
			searchResults = [];
		}

		// Cleanup function
		return () => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
		};
	});

	// Helper function to show confirmation dialog
	function showConfirmation(
		title: string,
		description: string,
		action: () => void,
		destructive = false
	) {
		confirmationDialog = {
			open: true,
			title,
			description,
			action,
			destructive
		};
	}

	function closeConfirmation() {
		confirmationDialog.open = false;
	}

	function executeConfirmedAction() {
		confirmationDialog.action();
		closeConfirmation();
	}

	function confirmInviteUser(
		userId: string,
		username: string,
		role: 'leader' | 'event_manager' | 'member'
	) {
		const roleLabel = roleOptions.find((r) => r.value === role)?.label || role;
		showConfirmation(
			'Invite User',
			`Are you sure you want to invite ${username} as ${roleLabel}?`,
			() => inviteUser(userId, role)
		);
	}

	async function inviteUser(userId: string, role: 'leader' | 'event_manager' | 'member') {
		try {
			await addGroupMember(client, group.id, userId, role, user.id);
			toast.success(`Successfully invited user as ${role}`);
			searchQuery = '';
			searchResults = [];
			selectedUser = null;
		} catch (error) {
			toast.error('Failed to invite user, please try again later or contact support');
			console.error('Error inviting user:', error);
		}
	}

	async function inviteByEmail() {
		if (!inviteEmail.trim()) {
			toast.error('Please enter an email address');
			return;
		}

		emailInviteLoading = true;
		try {
			const response = await fetch(`/api/groups/${group.id}/invite-email`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: inviteEmail,
					role: inviteRole
				})
			});

			const data = await response.json();

			if (response.ok) {
				if (data.success) {
					toast.success(`Invitation sent to ${inviteEmail}`);
					inviteEmail = '';
				} else {
					toast.error(data.message || 'Failed to send invitation');
				}
			} else {
				toast.error(data.error || 'Failed to send invitation');
			}
		} catch (error) {
			toast.error('Failed to send email invitation');
			console.error('Error sending email invitation:', error);
		} finally {
			emailInviteLoading = false;
		}
	}

	function confirmPromoteToLeader(userId: string, username: string) {
		showConfirmation(
			'Promote to Group Leader',
			`Are you sure you want to promote ${username} to Group Leader? They will have full group management privileges and admin access to all group events.`,
			() => promoteToLeader(userId)
		);
	}

	async function promoteToLeader(userId: string) {
		try {
			// Optimistically move user from event managers to leaders
			const memberToPromote = currentEventManagers.find((manager) => manager.user_id === userId);
			if (memberToPromote) {
				currentEventManagers = currentEventManagers.filter((manager) => manager.user_id !== userId);
				currentLeaders = [...currentLeaders, { ...memberToPromote, role: 'leader' }];
			}

			await updateGroupMemberRole(client, group.id, userId, 'leader', user.id);
			toast.success('Successfully promoted member to Group Leader');
		} catch (error) {
			toast.error('Failed to promote member, please try again later or contact support');
			console.error('Error promoting member to leader:', error);

			// Force refresh on error
			membersLoading = true;
		}
	}

	function confirmDemoteToEventManager(userId: string, username: string) {
		// Check if this would leave no leaders
		const isOnlyLeader = currentLeaders.length === 1;

		// Prevent demoting the last leader (including creators)
		if (isOnlyLeader) {
			toast.error(
				`Cannot demote ${username} as they are the only Group Leader. Promote another member to Leader first.`
			);
			return;
		}

		showConfirmation(
			'Demote to Event Manager',
			`Are you sure you want to demote ${username} from Group Leader to Event Manager? They will lose group management privileges but can still manage events.`,
			() => demoteToEventManager(userId)
		);
	}

	async function demoteToEventManager(userId: string) {
		try {
			// Optimistically move user from leaders to event managers
			const memberToDemote = currentLeaders.find((leader) => leader.user_id === userId);
			if (memberToDemote) {
				currentLeaders = currentLeaders.filter((leader) => leader.user_id !== userId);
				currentEventManagers = [
					...currentEventManagers,
					{ ...memberToDemote, role: 'event_manager' }
				];
			}

			await updateGroupMemberRole(client, group.id, userId, 'event_manager', user.id);
			toast.success('Successfully demoted to Event Manager');
		} catch (error) {
			toast.error('Failed to demote member, please try again later or contact support');
			console.error('Error demoting to event manager:', error);

			// Force refresh on error
			membersLoading = true;
		}
	}

	function confirmPromoteToEventManager(userId: string, username: string) {
		showConfirmation(
			'Promote to Event Manager',
			`Are you sure you want to promote ${username} to Event Manager? They will be able to create and manage events.`,
			() => promoteToEventManager(userId)
		);
	}

	async function promoteToEventManager(userId: string) {
		try {
			// Optimistically move user from members to event managers
			const memberToPromote = currentMembers.find((member) => member.user_id === userId);
			if (memberToPromote) {
				currentMembers = currentMembers.filter((member) => member.user_id !== userId);
				currentEventManagers = [
					...currentEventManagers,
					{ ...memberToPromote, role: 'event_manager' }
				];
			}

			await updateGroupMemberRole(client, group.id, userId, 'event_manager', user.id);
			toast.success('Successfully promoted to Event Manager');
		} catch (error) {
			toast.error('Failed to promote member, please try again later or contact support');
			console.error('Error promoting to event manager:', error);

			// Force refresh on error
			membersLoading = true;
		}
	}

	function confirmDemoteToMember(userId: string, username: string) {
		showConfirmation(
			'Demote to Member',
			`Are you sure you want to demote ${username} from Event Manager to Member? They will only be able to view group events.`,
			() => demoteToMember(userId)
		);
	}

	async function demoteToMember(userId: string) {
		try {
			// Optimistically move user from event managers to members
			const memberToDemote = currentEventManagers.find((manager) => manager.user_id === userId);
			if (memberToDemote) {
				currentEventManagers = currentEventManagers.filter((manager) => manager.user_id !== userId);
				currentMembers = [...currentMembers, { ...memberToDemote, role: 'member' }];
			}

			await updateGroupMemberRole(client, group.id, userId, 'member', user.id);
			toast.success('Successfully demoted to Member');
		} catch (error) {
			toast.error('Failed to demote member, please try again later or contact support');
			console.error('Error demoting to member:', error);

			// Force refresh on error
			membersLoading = true;
		}
	}

	function confirmRemoveMember(userId: string, username: string) {
		// Check if this is the user trying to remove themselves
		const isSelfRemoval = userId === user.id;

		// Check if this user is a leader and would be the last leader
		const userIsLeader = currentLeaders.some((leader) => leader.user_id === userId);
		const isOnlyLeader = userIsLeader && currentLeaders.length === 1;
		const isCreator = group.created_by_user_id === userId;

		// Prevent removing the last leader (even if they're the creator)
		if (isOnlyLeader) {
			const actionText = isSelfRemoval ? 'remove yourself' : `remove ${username}`;
			toast.error(
				`Cannot ${actionText} as they are the only Group Leader. Promote another member to Leader first.`
			);
			return;
		}

		// Prevent creator removal (separate from leader protection)
		if (isSelfRemoval && isCreator) {
			toast.error(
				'The group creator cannot be removed. Transfer ownership first if needed.'
			);
			return;
		}

		showConfirmation(
			'Remove Member',
			`Are you sure you want to remove ${username} from this group? This action cannot be undone.`,
			() => removeMember(userId),
			true // destructive action
		);
	}

	async function removeMember(userId: string) {
		try {
			console.log('🗑️ Removing member:', { userId, groupId: group.id });

			// Optimistically remove from local state
			currentLeaders = currentLeaders.filter((leader) => leader.user_id !== userId);
			currentEventManagers = currentEventManagers.filter((manager) => manager.user_id !== userId);
			currentMembers = currentMembers.filter((member) => member.user_id !== userId);

			await removeGroupMember(client, group.id, userId);
			console.log('✅ Member removal completed successfully');
			toast.success('Successfully removed member from group');
		} catch (error) {
			console.error('❌ Error removing member:', error);
			// Revert optimistic update on error by re-triggering the subscription
			toast.error('Failed to remove member, please try again later or contact support');

			// Force refresh the data - the subscription should restore the correct state
			membersLoading = true;
		}
	}

	async function approveJoinRequest(requestId: string, requestUsername: string, role = 'member') {
		try {
			await approveGroupJoinRequest(client, requestId, user.id, role);
			toast.success(`Approved ${requestUsername}'s join request`);
		} catch (error) {
			toast.error(`Failed to approve join request: ${error.message}`);
			console.error('Error approving join request:', error);
		}
	}

	async function rejectJoinRequest(requestId: string, requestUsername: string) {
		try {
			await rejectGroupJoinRequest(client, requestId, user.id);
			toast.success(`Rejected ${requestUsername}'s join request`);
		} catch (error) {
			toast.error(`Failed to reject join request: ${error.message}`);
			console.error('Error rejecting join request:', error);
		}
	}

	function getRoleColor(role: string) {
		switch (role) {
			case 'leader':
			case 'admin': // legacy support
				return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
			case 'event_manager':
			case 'editor': // legacy support
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
			case 'member':
				return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
		}
	}

	function closeAndFocusTrigger() {
		searchOpen = false;
		tick().then(() => {
			searchTriggerRef?.focus();
		});
	}

	// Helper function to check if leader actions are allowed
	function canRemoveOrDemoteLeader(userId: string) {
		const isOnlyLeader = currentLeaders.length === 1;

		// If they're the only leader, block ANY demotion to ensure at least 1 leader
		// (This includes creators - they must promote someone else first)
		if (isOnlyLeader) return false;

		return true;
	}
</script>

<svelte:head>
	<title>Manage {group.name} - Bonfire</title>
</svelte:head>

<div class="mx-4 mb-16 flex flex-col items-center justify-center">
	<section class="w-full sm:w-[600px] lg:w-[800px]">
		<!-- Header -->
		<div class="mb-6 flex items-center justify-between">
			<div class="flex items-center gap-4">
				<Button variant="outline" size="sm" onclick={() => goto(`/group/${group.id}`)}>
					<ArrowLeft class="mr-2 h-4 w-4" />
					Back to Group
				</Button>
				<div>
					<h1 class="text-2xl font-bold dark:text-white">Manage {group.name}</h1>
					<p class="text-sm text-gray-600 dark:text-gray-400">
						Invite new members and manage existing ones
					</p>
				</div>
			</div>
		</div>

		<Tabs.Root value="invite" class="w-full">
			<Tabs.List class="grid w-full grid-cols-3">
				<Tabs.Trigger value="invite">Invite Members</Tabs.Trigger>
				<Tabs.Trigger value="manage">Manage Members</Tabs.Trigger>
				<Tabs.Trigger value="requests">Join Requests</Tabs.Trigger>
			</Tabs.List>

			<!-- Invite Members Tab -->
			<Tabs.Content value="invite" class="space-y-6">
				<div class="space-y-6">
					<!-- Search Connected Users -->
					<Card.Root>
						<Card.Header>
							<Card.Title class="flex items-center gap-2">
								<Search class="h-5 w-5" />
								Invite Connected Users
							</Card.Title>
							<Card.Description>
								Search for users you've attended events with and invite them to this group
							</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-4">
							<div class="flex gap-2">
								<div class="flex-1">
									<input
										type="text"
										placeholder="Search by username..."
										bind:value={searchQuery}
										class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									/>
								</div>
								<Button
									variant="outline"
									disabled={!selectedUser}
									onclick={() =>
										selectedUser &&
										confirmInviteUser(selectedUser.id, selectedUser.username, selectedRole)}
								>
									<UserRoundPlus class="mr-2 h-4 w-4" />
									Invite as {roleOptions.find((r) => r.value === selectedRole)?.label ||
										selectedRole}
								</Button>
							</div>

							{#if searchQuery.trim()}
								<div class="max-h-64 space-y-2 overflow-y-auto">
									{#if searchLoading}
										<div class="p-4 text-center text-sm text-gray-500">Searching...</div>
									{:else if searchResults.length === 0}
										<div class="p-4 text-center text-sm text-gray-500">
											No connected users found matching "{searchQuery}"
										</div>
									{:else}
										{#each searchResults as searchUser}
											<div
												class="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-800 {selectedUser?.id ===
												searchUser.id
													? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
													: ''}"
												onclick={() => (selectedUser = searchUser)}
											>
												<div class="flex items-center gap-3">
													<ProfileAvatar userId={searchUser.id} baseHeightPx={32} />
													<div>
														<div class="font-medium">{searchUser.username}</div>
														<div class="text-xs text-gray-500">
															{searchUser.sharedEventsCount} shared events
														</div>
													</div>
												</div>
												{#if selectedUser?.id === searchUser.id}
													<Check class="h-4 w-4 text-blue-600" />
												{/if}
											</div>
										{/each}
									{/if}
								</div>
							{/if}

							{#if selectedUser}
								<div class="flex items-center gap-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
									<span class="text-sm">Invite <strong>{selectedUser.username}</strong> as:</span>
									<Select.Root type="single" bind:value={selectedRole}>
										<Select.Trigger class="h-8 w-[180px] text-sm">
											{selectedRoleTriggerContent}
										</Select.Trigger>
										<Select.Content>
											<Select.Group>
												{#each roleOptions as role (role.value)}
													<Select.Item value={role.value} label={role.label}>
														{role.label}
													</Select.Item>
												{/each}
											</Select.Group>
										</Select.Content>
									</Select.Root>
								</div>
							{/if}
						</Card.Content>
					</Card.Root>

					<!-- Email Invitation -->
					<Card.Root>
						<Card.Header>
							<Card.Title class="flex items-center gap-2">
								<Mail class="h-5 w-5" />
								Invite by Email
							</Card.Title>
							<Card.Description>
								Send an invitation email to someone not yet on the platform
							</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-4">
							<div class="flex gap-2">
								<Input
									type="email"
									placeholder="Enter email address..."
									bind:value={inviteEmail}
									class="flex-1"
								/>
								<Select.Root type="single" bind:value={inviteRole}>
									<Select.Trigger class="w-[180px]">
										{inviteRoleTriggerContent}
									</Select.Trigger>
									<Select.Content>
										<Select.Group>
											{#each roleOptions as role (role.value)}
												<Select.Item value={role.value} label={role.label}>
													{role.label}
												</Select.Item>
											{/each}
										</Select.Group>
									</Select.Content>
								</Select.Root>
								<Button
									disabled={!inviteEmail.trim() || emailInviteLoading}
									onclick={inviteByEmail}
								>
									{#if emailInviteLoading}
										Sending...
									{:else}
										<Mail class="mr-2 h-4 w-4" />
										Send Invite
									{/if}
								</Button>
							</div>
						</Card.Content>
					</Card.Root>
				</div>
			</Tabs.Content>

			<!-- Manage Members Tab -->
			<Tabs.Content value="manage" class="space-y-6">
				{#if membersLoading}
					<div class="flex justify-center p-8">
						<div class="text-sm text-gray-500 dark:text-gray-400">Loading members...</div>
					</div>
				{:else}
					<!-- Role Explanation -->
					<Collapsible.Root class="rounded-lg bg-slate-200/80 dark:bg-slate-800/80 dark:text-white">
						<Collapsible.Trigger
							class="flex w-full items-center justify-between space-x-4 px-4 py-3"
						>
							<h4 class="text-sm font-semibold">What can different roles do?</h4>
							<ChevronsUpDown class="h-4 w-4" />
						</Collapsible.Trigger>
						<CollapsibleContent duration={300}>
							<div transition:slide={{ duration: 300 }} class="px-4 pb-3">
								<div class="grid gap-4 md:grid-cols-3">
									<div>
										<div class="mb-2 text-sm font-medium text-red-600 dark:text-red-400">
											Group Leaders
										</div>
										<ul class="space-y-1 text-xs">
											<li>• Full group management</li>
											<li>• Manage members and roles</li>
											<li>• Admin access to all group events</li>
											<li>• Edit group details and settings</li>
											<li>• Can do anything that Event Managers can do</li>
										</ul>
									</div>
									<div>
										<div class="mb-2 text-sm font-medium text-blue-600 dark:text-blue-400">
											Event Managers
										</div>
										<ul class="space-y-1 text-xs">
											<li>• Create and manage events</li>
											<li>• View group information</li>
											<li>• Participate in group events</li>
											<li>• Basic member interaction permissions</li>
										</ul>
									</div>
									<div>
										<div class="mb-2 text-sm font-medium text-green-600 dark:text-green-400">
											Members
										</div>
										<ul class="space-y-1 text-xs">
											<li>• View group events</li>
											<li>• Participate in group events</li>
											<li>• No admin privileges</li>
											<li>• Cannot create or manage events</li>
										</ul>
									</div>
								</div>
							</div>
						</CollapsibleContent>
					</Collapsible.Root>

					<!-- Group Creator -->
					<Card.Root class="border-2 border-purple-200 dark:border-purple-800">
						<Card.Header>
							<Card.Title class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<ProfileAvatar userId={group.creator?.id} baseHeightPx={40} />
									<div>
										<span class="text-base">{group.creator?.username}</span>
										<Badge
											class="ml-2 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
											size="sm"
										>
											Creator
										</Badge>
									</div>
								</div>
							</Card.Title>
							<Card.Description>Group founder with full ownership rights</Card.Description>
						</Card.Header>
					</Card.Root>

					<!-- Leaders Section -->
					{#if currentLeaders.length > 0}
						<div>
							<h2 class="mb-3 text-lg font-semibold dark:text-white">
								Group Leaders ({currentLeaders.length})
							</h2>
							<div class="space-y-3">
								{#each currentLeaders as leader (leader.user?.id || leader.id)}
									<Card.Root class="bg-red-50 dark:bg-red-950/20">
										<Card.Header>
											<Card.Title class="flex items-center justify-between">
												<div class="flex items-center gap-3">
													<ProfileAvatar userId={leader.user?.id} baseHeightPx={40} />
													<div>
														<span class="text-base">{leader.user?.username || 'Loading...'}</span>
														<Badge class="{getRoleColor(leader.role)} ml-2" size="sm"
															>Group Leader</Badge
														>
													</div>
												</div>
											</Card.Title>
											<Card.Description>
												Added on {formatHumanReadable(leader.created_at)}
												{#if leader.added_by}
													by <span class="font-bold">
														{#if user.id == leader.added_by_user_id}
															you
														{:else}
															{leader.added_by?.username || 'Unknown'}
														{/if}
													</span>
												{/if}
											</Card.Description>
										</Card.Header>
										<Card.Footer class="flex flex-col gap-2">
											{#if !canRemoveOrDemoteLeader(leader.user_id)}
												<div
													class="rounded bg-amber-50 px-2 py-1 text-xs text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
												>
													⚠️ Cannot remove/demote the only Group Leader. Promote another
													member first.
												</div>
											{/if}
											<div class="flex justify-between">
												<Button
													variant="outline"
													size="sm"
													disabled={!canRemoveOrDemoteLeader(leader.user_id)}
													onclick={() =>
														confirmDemoteToEventManager(
															leader.user_id,
															leader.user?.username || 'Unknown User'
														)}
												>
													<ChevronDown class="mr-1 h-4 w-4" />
													Demote to Event Manager
												</Button>
												<Button
													variant="destructive"
													size="sm"
													disabled={!canRemoveOrDemoteLeader(leader.user_id)}
													onclick={() =>
														confirmRemoveMember(
															leader.user_id,
															leader.user?.username || 'Unknown User'
														)}
												>
													<UserRoundMinus class="mr-1 h-4 w-4" />
													Remove
												</Button>
											</div>
										</Card.Footer>
									</Card.Root>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Event Managers Section -->
					{#if currentEventManagers.length > 0}
						<div>
							<h2 class="mb-3 text-lg font-semibold dark:text-white">
								Event Managers ({currentEventManagers.length})
							</h2>
							<div class="space-y-3">
								{#each currentEventManagers as eventManager (eventManager.user?.id || eventManager.id)}
									<Card.Root class="bg-blue-50 dark:bg-blue-950/20">
										<Card.Header>
											<Card.Title class="flex items-center justify-between">
												<div class="flex items-center gap-3">
													<ProfileAvatar userId={eventManager.user?.id} baseHeightPx={40} />
													<div>
														<span class="text-base"
															>{eventManager.user?.username || 'Loading...'}</span
														>
														<Badge class="{getRoleColor(eventManager.role)} ml-2" size="sm"
															>Event Manager</Badge
														>
													</div>
												</div>
											</Card.Title>
											<Card.Description>
												Added on {formatHumanReadable(eventManager.created_at)}
												{#if eventManager.added_by}
													by <span class="font-bold">
														{#if user.id == eventManager.added_by_user_id}
															you
														{:else}
															{eventManager.added_by?.username || 'Unknown'}
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
													onclick={() =>
														confirmPromoteToLeader(
															eventManager.user_id,
															eventManager.user?.username || 'Unknown User'
														)}
												>
													<ChevronUp class="mr-1 h-4 w-4" />
													Promote to Group Leader
												</Button>
												<Button
													variant="outline"
													size="sm"
													onclick={() =>
														confirmDemoteToMember(
															eventManager.user_id,
															eventManager.user?.username || 'Unknown User'
														)}
												>
													<ChevronDown class="mr-1 h-4 w-4" />
													Demote to Member
												</Button>
											</div>
											<Button
												variant="destructive"
												size="sm"
												onclick={() =>
													confirmRemoveMember(
														eventManager.user_id,
														eventManager.user?.username || 'Unknown User'
													)}
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
						<div>
							<h2 class="mb-3 text-lg font-semibold dark:text-white">
								Members ({currentMembers.length})
							</h2>
							<div class="space-y-3">
								{#each currentMembers as member (member.user?.id || member.id)}
									<Card.Root class="bg-green-50 dark:bg-green-950/20">
										<Card.Header>
											<Card.Title class="flex items-center justify-between">
												<div class="flex items-center gap-3">
													<ProfileAvatar userId={member.user?.id} baseHeightPx={40} />
													<div>
														<span class="text-base">{member.user?.username || 'Loading...'}</span>
														<Badge class="{getRoleColor(member.role)} ml-2" size="sm">Member</Badge>
													</div>
												</div>
											</Card.Title>
											<Card.Description>
												Added on {formatHumanReadable(member.created_at)}
												{#if member.added_by}
													by <span class="font-bold">
														{#if user.id == member.added_by_user_id}
															you
														{:else}
															{member.added_by?.username || 'Unknown'}
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
													onclick={() =>
														confirmPromoteToEventManager(
															member.user_id,
															member.user?.username || 'Unknown User'
														)}
												>
													<ChevronUp class="mr-1 h-4 w-4" />
													Promote to Event Manager
												</Button>
											</div>
											<Button
												variant="destructive"
												size="sm"
												onclick={() =>
													confirmRemoveMember(
														member.user_id,
														member.user?.username || 'Unknown User'
													)}
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
					{#if currentLeaders.length === 0 && currentEventManagers.length === 0 && currentMembers.length === 0}
						<div class="py-8 text-center">
							<div class="text-gray-500 dark:text-gray-400">
								No members yet besides the group creator. Use the "Invite Members" tab to add
								your first members!
							</div>
						</div>
					{/if}
				{/if}
			</Tabs.Content>

			<!-- Join Requests Tab -->
			<Tabs.Content value="requests" class="space-y-6">
				<div class="space-y-6">
					<!-- Group Join Settings -->
					<Card.Root>
						<Card.Header>
							<Card.Title>Join Request Settings</Card.Title>
							<Card.Description>Configure how people can join your group</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-4">
							<div class="flex items-center justify-between">
								<div>
									<div class="font-medium">Allow Join Requests</div>
									<div class="text-sm text-gray-500">
										Allow non-members to request to join your group
									</div>
								</div>
								<Badge variant={group.allow_join_requests ? 'default' : 'secondary'}>
									{group.allow_join_requests ? 'Enabled' : 'Disabled'}
								</Badge>
							</div>

							{#if group.allow_join_requests}
								<div class="flex items-center justify-between">
									<div>
										<div class="font-medium">Auto-Approve Requests</div>
										<div class="text-sm text-gray-500">
											Automatically approve join requests without review
										</div>
									</div>
									<Badge
										variant={group.auto_approve_join_requests ? 'default' : 'secondary'}
									>
										{group.auto_approve_join_requests ? 'Enabled' : 'Disabled'}
									</Badge>
								</div>

								<div class="flex items-center justify-between">
									<div>
										<div class="font-medium">Default Join Role</div>
										<div class="text-sm text-gray-500">Role assigned to approved join requests</div>
									</div>
									<Badge variant="outline">
										{group.default_join_role
											.charAt(0)
											.toUpperCase()}{group.default_join_role.slice(1)}
									</Badge>
								</div>
							{/if}
						</Card.Content>
					</Card.Root>

					<!-- Join Requests List -->
					{#if joinRequestsLoading}
						<div class="flex justify-center p-8">
							<div class="text-sm text-gray-500 dark:text-gray-400">Loading join requests...</div>
						</div>
					{:else if joinRequests.length === 0}
						<Card.Root>
							<Card.Content class="flex flex-col items-center justify-center py-12">
								<UserPlus class="mb-4 h-12 w-12 text-gray-400" />
								<h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-white">
									No Join Requests
								</h3>
								<p class="text-center text-sm text-gray-500">
									{#if !group.allow_join_requests}
										Join requests are currently disabled for this group.
									{:else}
										No one has requested to join your group yet.
									{/if}
								</p>
							</Card.Content>
						</Card.Root>
					{:else}
						<div class="space-y-4">
							<h2 class="text-lg font-semibold dark:text-white">
								Join Requests ({joinRequests.filter((r) => r.status === 'pending').length} pending)
							</h2>

							{#each joinRequests as request (request.id)}
								<Card.Root
									class="border-l-4 {request.status === 'pending'
										? 'border-l-orange-500'
										: request.status === 'approved'
											? 'border-l-green-500'
											: 'border-l-red-500'}"
								>
									<Card.Header>
										<Card.Title class="flex items-center justify-between">
											<div class="flex items-center gap-3">
												<ProfileAvatar userId={request.user?.id} baseHeightPx={40} />
												<div>
													<span class="text-base">{request.user?.username || 'Loading...'}</span>
													<Badge
														class="ml-2"
														variant={request.status === 'pending'
															? 'secondary'
															: request.status === 'approved'
																? 'default'
																: 'destructive'}
													>
														{request.status.charAt(0).toUpperCase()}{request.status.slice(1)}
													</Badge>
												</div>
											</div>
											<div class="text-right">
												<div class="text-sm text-gray-500">
													{formatHumanReadable(request.created_at)}
												</div>
											</div>
										</Card.Title>
										{#if request.message}
											<Card.Description class="mt-2">
												<strong>Message:</strong>
												{request.message}
											</Card.Description>
										{/if}
										{#if request.status !== 'pending' && request.reviewed_by}
											<Card.Description class="mt-2 text-xs">
												{request.status === 'approved' ? 'Approved' : 'Rejected'} by {request
													.reviewed_by.username}
												on {formatHumanReadable(request.reviewed_at)}
											</Card.Description>
										{/if}
									</Card.Header>

									{#if request.status === 'pending'}
										<Card.Footer class="flex justify-between">
											<div class="flex gap-2">
												<Button
													size="sm"
													onclick={() =>
														approveJoinRequest(request.id, request.user?.username || 'User')}
												>
													Approve as Member
												</Button>
												<Button
													variant="outline"
													size="sm"
													onclick={() =>
														approveJoinRequest(
															request.id,
															request.user?.username || 'User',
															'event_manager'
														)}
												>
													Approve as Event Manager
												</Button>
											</div>
											<Button
												variant="destructive"
												size="sm"
												onclick={() =>
													rejectJoinRequest(request.id, request.user?.username || 'User')}
											>
												Reject
											</Button>
										</Card.Footer>
									{/if}
								</Card.Root>
							{/each}
						</div>
					{/if}
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</section>
</div>

<!-- Confirmation Dialog -->
<AlertDialog.Root bind:open={confirmationDialog.open}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{confirmationDialog.title}</AlertDialog.Title>
			<AlertDialog.Description>
				{confirmationDialog.description}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={closeConfirmation}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={executeConfirmedAction}
				class={confirmationDialog.destructive ? 'bg-red-600 hover:bg-red-700' : ''}
			>
				Confirm
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
