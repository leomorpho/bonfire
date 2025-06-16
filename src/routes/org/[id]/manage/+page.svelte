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
	import { UserRoundMinus, UserRoundPlus, ChevronUp, ChevronDown, Mail, ArrowLeft, Search } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card/index.js';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import ProfileAvatar from '$lib/components/profile/profile-avatar/ProfileAvatar.svelte';
	import { slide } from 'svelte/transition';
	import CollapsibleContent from '$lib/components/CollapsibleContent.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { updateOrganizationMemberRole, removeOrganizationMember, addOrganizationMember } from '$lib/organizations';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { goto } from '$app/navigation';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';

	const { data } = $props();
	const { organization, members: initialMembers, userRole, user } = data;

	let client: TriplitClient;
	let membersLoading = $state(true);
	let searchLoading = $state(false);
	let emailInviteLoading = $state(false);

	// Member management state
	let currentAdmins: any[] = $state([]);
	let currentEditors: any[] = $state([]);
	let currentMembers: any[] = $state([]);

	// User search state
	let searchQuery = $state('');
	let searchResults: any[] = $state([]);
	let selectedUser = $state<any>(null);
	let selectedRole = $state<'admin' | 'editor' | 'member'>('member');

	// Email invite state
	let inviteEmail = $state('');
	let inviteRole = $state<'admin' | 'editor' | 'member'>('member');

	// Role options for dropdowns
	const roleOptions = [
		{ value: 'member', label: 'Member' },
		{ value: 'editor', label: 'Editor' },
		{ value: 'admin', label: 'Admin' }
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
				.query('organization_members')
				.Where([['organization_id', '=', organization.id]])
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
			console.log('📡 API Response:', { status: response.status, users: data.users?.length || 0, data });
			
			if (response.ok && data.users) {
				// Filter out users who are already members
				const existingMemberIds = [...currentAdmins, ...currentEditors, ...currentMembers].map(m => m.user_id);
				const filteredUsers = data.users.filter(user => !existingMemberIds.includes(user.id));
				console.log('✅ Found users:', filteredUsers.length, 'after filtering out', existingMemberIds.length, 'existing members');
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
	function showConfirmation(title: string, description: string, action: () => void, destructive = false) {
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

	function confirmInviteUser(userId: string, username: string, role: 'admin' | 'editor' | 'member') {
		showConfirmation(
			'Invite User',
			`Are you sure you want to invite ${username} as ${role}?`,
			() => inviteUser(userId, role)
		);
	}

	async function inviteUser(userId: string, role: 'admin' | 'editor' | 'member') {
		try {
			await addOrganizationMember(client, organization.id, userId, role, user.id);
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
			const response = await fetch(`/api/organizations/${organization.id}/invite-email`, {
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

	function confirmPromoteToAdmin(userId: string, username: string) {
		showConfirmation(
			'Promote to Admin',
			`Are you sure you want to promote ${username} to admin? They will have full organization management privileges.`,
			() => promoteToAdmin(userId)
		);
	}

	async function promoteToAdmin(userId: string) {
		try {
			await updateOrganizationMemberRole(client, organization.id, userId, 'admin', user.id);
			toast.success('Successfully promoted member to admin');
		} catch (error) {
			toast.error('Failed to promote member, please try again later or contact support');
			console.error('Error promoting member to admin:', error);
		}
	}

	function confirmPromoteToEditor(userId: string, username: string) {
		showConfirmation(
			'Promote to Editor',
			`Are you sure you want to promote ${username} to editor? They will be able to create and manage events.`,
			() => promoteToEditor(userId)
		);
	}

	async function promoteToEditor(userId: string) {
		try {
			await updateOrganizationMemberRole(client, organization.id, userId, 'editor', user.id);
			toast.success('Successfully promoted member to editor');
		} catch (error) {
			toast.error('Failed to promote member, please try again later or contact support');
			console.error('Error promoting member to editor:', error);
		}
	}

	function confirmDemoteToEditor(userId: string, username: string) {
		// Check if this would leave no admins
		const isSelfDemotion = userId === user.id;
		const isOnlyAdmin = currentAdmins.length === 1;
		const isCreator = organization.created_by_user_id === userId;
		
		if (isSelfDemotion && isOnlyAdmin && !isCreator) {
			toast.error('You cannot demote yourself as you are the only admin. Promote another member to admin first.');
			return;
		}
		
		showConfirmation(
			'Demote to Editor',
			`Are you sure you want to demote ${username} from admin to editor? They will lose admin privileges.`,
			() => demoteToEditor(userId)
		);
	}

	async function demoteToEditor(userId: string) {
		try {
			await updateOrganizationMemberRole(client, organization.id, userId, 'editor', user.id);
			toast.success('Successfully demoted admin to editor');
		} catch (error) {
			toast.error('Failed to demote admin, please try again later or contact support');
			console.error('Error demoting admin to editor:', error);
		}
	}

	function confirmDemoteToMember(userId: string, username: string, currentRole: string) {
		showConfirmation(
			'Demote to Member',
			`Are you sure you want to demote ${username} from ${currentRole} to member? They will lose their current privileges.`,
			() => demoteToMember(userId)
		);
	}

	async function demoteToMember(userId: string) {
		try {
			await updateOrganizationMemberRole(client, organization.id, userId, 'member', user.id);
			toast.success('Successfully demoted to member');
		} catch (error) {
			toast.error('Failed to demote member, please try again later or contact support');
			console.error('Error demoting to member:', error);
		}
	}

	function confirmRemoveMember(userId: string, username: string) {
		// Check if this is the user trying to remove themselves
		const isSelfRemoval = userId === user.id;
		
		// Check if this user is an admin and would be the last admin
		const userIsAdmin = currentAdmins.some(admin => admin.user_id === userId);
		const isOnlyAdmin = userIsAdmin && currentAdmins.length === 1;
		const isCreator = organization.created_by_user_id === userId;
		
		if (isSelfRemoval && isOnlyAdmin && !isCreator) {
			toast.error('You cannot remove yourself as you are the only admin. Promote another member to admin first.');
			return;
		}
		
		if (isSelfRemoval && isCreator) {
			toast.error('The organization creator cannot be removed. Transfer ownership first if needed.');
			return;
		}
		
		showConfirmation(
			'Remove Member',
			`Are you sure you want to remove ${username} from this organization? This action cannot be undone.`,
			() => removeMember(userId),
			true // destructive action
		);
	}

	async function removeMember(userId: string) {
		try {
			await removeOrganizationMember(client, organization.id, userId);
			toast.success('Successfully removed member from organization');
		} catch (error) {
			toast.error('Failed to remove member, please try again later or contact support');
			console.error('Error removing member:', error);
		}
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

	function closeAndFocusTrigger() {
		searchOpen = false;
		tick().then(() => {
			searchTriggerRef?.focus();
		});
	}

	// Helper function to check if admin actions are allowed
	function canRemoveOrDemoteAdmin(userId: string) {
		const isSelfAction = userId === user.id;
		const isOnlyAdmin = currentAdmins.length === 1;
		const isCreator = organization.created_by_user_id === userId;
		
		// Creator can always be demoted/removed (though removal will be blocked with a message)
		if (isCreator) return true;
		
		// If it's self-action and they're the only admin, block it
		if (isSelfAction && isOnlyAdmin) return false;
		
		return true;
	}
</script>

<svelte:head>
	<title>Manage {organization.name} - Bonfire</title>
</svelte:head>

<div class="mx-4 mb-16 flex flex-col items-center justify-center">
	<section class="w-full sm:w-[600px] lg:w-[800px]">
		<!-- Header -->
		<div class="mb-6 flex items-center justify-between">
			<div class="flex items-center gap-4">
				<Button
					variant="outline"
					size="sm"
					onclick={() => goto(`/org/${organization.id}`)}
				>
					<ArrowLeft class="mr-2 h-4 w-4" />
					Back to Organization
				</Button>
				<div>
					<h1 class="text-2xl font-bold dark:text-white">Manage {organization.name}</h1>
					<p class="text-sm text-gray-600 dark:text-gray-400">Invite new members and manage existing ones</p>
				</div>
			</div>
		</div>

		<Tabs.Root value="invite" class="w-full">
			<Tabs.List class="grid w-full grid-cols-2">
				<Tabs.Trigger value="invite">Invite Members</Tabs.Trigger>
				<Tabs.Trigger value="manage">Manage Members</Tabs.Trigger>
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
								Search for users you've attended events with and invite them to this organization
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
									onclick={() => selectedUser && confirmInviteUser(selectedUser.id, selectedUser.username, selectedRole)}
								>
									<UserRoundPlus class="mr-2 h-4 w-4" />
									Invite as {selectedRole}
								</Button>
							</div>

							{#if searchQuery.trim()}
								<div class="space-y-2 max-h-64 overflow-y-auto">
									{#if searchLoading}
										<div class="p-4 text-center text-sm text-gray-500">Searching...</div>
									{:else if searchResults.length === 0}
										<div class="p-4 text-center text-sm text-gray-500">
											No connected users found matching "{searchQuery}"
										</div>
									{:else}
										{#each searchResults as searchUser}
											<div
												class="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 {selectedUser?.id === searchUser.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' : ''}"
												onclick={() => selectedUser = searchUser}
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
								<div class="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
									<span class="text-sm">Invite <strong>{selectedUser.username}</strong> as:</span>
									<Select.Root bind:value={selectedRole}>
										<Select.Trigger class="w-[120px] h-8 text-sm">
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
								<Select.Root bind:value={inviteRole}>
									<Select.Trigger class="w-[120px]">
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
						<Collapsible.Trigger class="flex w-full items-center justify-between space-x-4 px-4 py-3">
							<h4 class="text-sm font-semibold">What can different roles do?</h4>
							<ChevronsUpDown class="h-4 w-4" />
						</Collapsible.Trigger>
						<CollapsibleContent duration={300}>
							<div transition:slide={{ duration: 300 }} class="px-4 pb-3">
								<div class="grid gap-4 md:grid-cols-3">
									<div>
										<div class="mb-2 text-sm font-medium text-red-600 dark:text-red-400">Admins</div>
										<ul class="text-xs space-y-1">
											<li>• Full organization management</li>
											<li>• Manage members and roles</li>
											<li>• Admin access to all org events</li>
											<li>• Edit organization details</li>
										</ul>
									</div>
									<div>
										<div class="mb-2 text-sm font-medium text-yellow-600 dark:text-yellow-400">Editors</div>
										<ul class="text-xs space-y-1">
											<li>• Create and manage events</li>
											<li>• Edit organization content</li>
											<li>• View all members</li>
										</ul>
									</div>
									<div>
										<div class="mb-2 text-sm font-medium text-green-600 dark:text-green-400">Members</div>
										<ul class="text-xs space-y-1">
											<li>• Participate in organization events</li>
											<li>• View organization information</li>
											<li>• Basic interaction permissions</li>
										</ul>
									</div>
								</div>
							</div>
						</CollapsibleContent>
					</Collapsible.Root>

					<!-- Organization Creator -->
					<Card.Root class="border-2 border-purple-200 dark:border-purple-800">
						<Card.Header>
							<Card.Title class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<ProfileAvatar userId={organization.creator?.id} baseHeightPx={40} />
									<div>
										<span class="text-base">{organization.creator?.username}</span>
										<Badge class="ml-2 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" size="sm">
											Creator
										</Badge>
									</div>
								</div>
							</Card.Title>
							<Card.Description>
								Organization founder with full ownership rights
							</Card.Description>
						</Card.Header>
					</Card.Root>

					<!-- Admins Section -->
					{#if currentAdmins.length > 0}
						<div>
							<h2 class="mb-3 text-lg font-semibold dark:text-white">
								Admins ({currentAdmins.length})
							</h2>
							<div class="space-y-3">
								{#each currentAdmins as admin (admin.user.id)}
									<Card.Root class="bg-red-50 dark:bg-red-950/20">
										<Card.Header>
											<Card.Title class="flex items-center justify-between">
												<div class="flex items-center gap-3">
													<ProfileAvatar userId={admin.user?.id} baseHeightPx={40} />
													<div>
														<span class="text-base">{admin.user.username}</span>
														<Badge class="{getRoleColor('admin')} ml-2" size="sm">Admin</Badge>
													</div>
												</div>
											</Card.Title>
											<Card.Description>
												Added on {formatHumanReadable(admin.created_at)}
												{#if admin.added_by}
													by <span class="font-bold">
														{#if user.id == admin.added_by_user_id}
															you
														{:else}
															{admin.added_by.username}
														{/if}
													</span>
												{/if}
											</Card.Description>
										</Card.Header>
										<Card.Footer class="flex flex-col gap-2">
											{#if !canRemoveOrDemoteAdmin(admin.user_id)}
												<div class="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded">
													⚠️ Cannot remove/demote the only admin. Promote another member first.
												</div>
											{/if}
											<div class="flex justify-between">
												<Button 
													variant="outline" 
													size="sm" 
													disabled={!canRemoveOrDemoteAdmin(admin.user_id)}
													onclick={() => confirmDemoteToEditor(admin.user_id, admin.user.username)}
												>
													<ChevronDown class="mr-1 h-4 w-4" />
													Demote to Editor
												</Button>
												<Button 
													variant="destructive" 
													size="sm" 
													disabled={!canRemoveOrDemoteAdmin(admin.user_id)}
													onclick={() => confirmRemoveMember(admin.user_id, admin.user.username)}
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

					<!-- Editors Section -->
					{#if currentEditors.length > 0}
						<div>
							<h2 class="mb-3 text-lg font-semibold dark:text-white">
								Editors ({currentEditors.length})
							</h2>
							<div class="space-y-3">
								{#each currentEditors as editor (editor.user.id)}
									<Card.Root class="bg-yellow-50 dark:bg-yellow-950/20">
										<Card.Header>
											<Card.Title class="flex items-center justify-between">
												<div class="flex items-center gap-3">
													<ProfileAvatar userId={editor.user?.id} baseHeightPx={40} />
													<div>
														<span class="text-base">{editor.user.username}</span>
														<Badge class="{getRoleColor('editor')} ml-2" size="sm">Editor</Badge>
													</div>
												</div>
											</Card.Title>
											<Card.Description>
												Added on {formatHumanReadable(editor.created_at)}
												{#if editor.added_by}
													by <span class="font-bold">
														{#if user.id == editor.added_by_user_id}
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
												<Button variant="outline" size="sm" onclick={() => confirmPromoteToAdmin(editor.user_id, editor.user.username)}>
													<ChevronUp class="mr-1 h-4 w-4" />
													Promote to Admin
												</Button>
												<Button variant="outline" size="sm" onclick={() => confirmDemoteToMember(editor.user_id, editor.user.username, 'editor')}>
													<ChevronDown class="mr-1 h-4 w-4" />
													Demote to Member
												</Button>
											</div>
											<Button variant="destructive" size="sm" onclick={() => confirmRemoveMember(editor.user_id, editor.user.username)}>
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
								{#each currentMembers as member (member.user.id)}
									<Card.Root class="bg-green-50 dark:bg-green-950/20">
										<Card.Header>
											<Card.Title class="flex items-center justify-between">
												<div class="flex items-center gap-3">
													<ProfileAvatar userId={member.user?.id} baseHeightPx={40} />
													<div>
														<span class="text-base">{member.user.username}</span>
														<Badge class="{getRoleColor('member')} ml-2" size="sm">Member</Badge>
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
															{member.added_by.username}
														{/if}
													</span>
												{/if}
											</Card.Description>
										</Card.Header>
										<Card.Footer class="flex justify-between">
											<div class="flex gap-2">
												<Button variant="outline" size="sm" onclick={() => confirmPromoteToEditor(member.user_id, member.user.username)}>
													<ChevronUp class="mr-1 h-4 w-4" />
													Promote to Editor
												</Button>
												<Button variant="outline" size="sm" onclick={() => confirmPromoteToAdmin(member.user_id, member.user.username)}>
													<ChevronUp class="mr-1 h-4 w-4" />
													Promote to Admin
												</Button>
											</div>
											<Button variant="destructive" size="sm" onclick={() => confirmRemoveMember(member.user_id, member.user.username)}>
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
						<div class="text-center py-8">
							<div class="text-gray-500 dark:text-gray-400">
								No members yet besides the organization creator. Use the "Invite Members" tab to add your first members!
							</div>
						</div>
					{/if}
				{/if}
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