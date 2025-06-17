<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { ArrowLeft, Save, Trash2, Globe, Lock, AlertTriangle } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	const { data } = $props();
	const { group, userRole, user } = data;

	// Form state
	let groupName = $state(group.name || '');
	let groupDescription = $state(group.description || '');
	let groupWebsiteUrl = $state(group.website_url || '');
	let isPublic = $state(group.is_public || false);
	let allowJoinRequests = $state(group.allow_join_requests || false);
	let autoApproveJoinRequests = $state(group.auto_approve_join_requests || false);
	let defaultJoinRole = $state(group.default_join_role || 'member');

	// Loading states
	let saving = $state(false);
	let deleting = $state(false);

	// Deletion dialog state
	let deleteDialogOpen = $state(false);
	let deleteConfirmationName = $state('');
	let deleteEvents = $state(false);

	// Role options for join requests
	const roleOptions = [
		{ value: 'member', label: 'Member' },
		{ value: 'event_manager', label: 'Event Manager' }
	];

	const defaultJoinRoleTriggerContent = $derived(
		roleOptions.find((r) => r.value === defaultJoinRole)?.label ?? 'Select role'
	);

	// Enable delete button only when confirmation name matches
	const deleteButtonEnabled = $derived(
		deleteConfirmationName.trim() === group.name && !deleting
	);

	async function saveSettings() {
		if (!groupName.trim()) {
			toast.error('Group name is required');
			return;
		}

		saving = true;
		try {
			const response = await fetch(`/api/groups/${group.id}/settings`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: groupName.trim(),
					description: groupDescription.trim() || null,
					website_url: groupWebsiteUrl.trim() || null,
					is_public: isPublic,
					allow_join_requests: allowJoinRequests,
					auto_approve_join_requests: autoApproveJoinRequests,
					default_join_role: defaultJoinRole
				})
			});

			const result = await response.json();

			if (response.ok) {
				toast.success('Group settings updated successfully');
			} else {
				toast.error(result.error || 'Failed to update group settings');
			}
		} catch (error) {
			toast.error('Failed to update group settings');
			console.error('Error updating group settings:', error);
		} finally {
			saving = false;
		}
	}

	async function deleteGroup() {
		if (!deleteButtonEnabled) {
			return;
		}

		deleting = true;
		try {
			const response = await fetch(`/api/groups/${group.id}`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					groupName: group.name,
					confirmationName: deleteConfirmationName.trim(),
					deleteEvents
				})
			});

			const result = await response.json();

			if (response.ok) {
				toast.success(result.message || 'Group deleted successfully');
				deleteDialogOpen = false;
				goto('/');
			} else {
				toast.error(result.error || 'Failed to delete group');
			}
		} catch (error) {
			toast.error('Failed to delete group');
			console.error('Error deleting group:', error);
		} finally {
			deleting = false;
		}
	}

	function openDeleteDialog() {
		deleteConfirmationName = '';
		deleteEvents = false;
		deleteDialogOpen = true;
	}
</script>

<svelte:head>
	<title>Settings - {group.name} - Bonfire</title>
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
					<h1 class="text-2xl font-bold dark:text-white">Group Settings</h1>
					<p class="text-sm text-gray-600 dark:text-gray-400">
						Manage your group information and preferences
					</p>
				</div>
			</div>
		</div>

		<div class="space-y-6">
			<!-- Basic Information -->
			<Card.Root>
				<Card.Header>
					<Card.Title>Basic Information</Card.Title>
					<Card.Description>Update your group's basic details</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div>
						<Label for="name">Group Name *</Label>
						<Input
							id="name"
							bind:value={groupName}
							placeholder="Enter group name"
							maxlength="100"
						/>
					</div>

					<div>
						<Label for="description">Description</Label>
						<Textarea
							id="description"
							bind:value={groupDescription}
							placeholder="Describe your group (optional)"
							rows={3}
							maxlength="500"
						/>
					</div>

					<div>
						<Label for="website">Website URL</Label>
						<Input
							id="website"
							bind:value={groupWebsiteUrl}
							placeholder="https://example.com (optional)"
							type="url"
						/>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Privacy Settings -->
			<Card.Root>
				<Card.Header>
					<Card.Title>Privacy & Visibility</Card.Title>
					<Card.Description>Control who can see and join your group</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div class="flex items-center justify-between">
						<div class="space-y-1">
							<div class="flex items-center gap-2">
								{#if isPublic}
									<Globe class="h-4 w-4 text-green-600" />
								{:else}
									<Lock class="h-4 w-4 text-orange-600" />
								{/if}
								<Label for="public">Public Group</Label>
							</div>
							<p class="text-sm text-gray-600 dark:text-gray-400">
								{#if isPublic}
									Anyone can discover and view your group
								{:else}
									Only members can see your group
								{/if}
							</p>
						</div>
						<Switch id="public" bind:checked={isPublic} />
					</div>

					{#if isPublic}
						<div class="space-y-4 border-l-2 border-gray-200 pl-4 dark:border-gray-700">
							<div class="flex items-center justify-between">
								<div class="space-y-1">
									<Label for="join-requests">Allow Join Requests</Label>
									<p class="text-sm text-gray-600 dark:text-gray-400">
										Let people request to join your group
									</p>
								</div>
								<Switch id="join-requests" bind:checked={allowJoinRequests} />
							</div>

							{#if allowJoinRequests}
								<div class="space-y-4 border-l-2 border-gray-200 pl-4 dark:border-gray-700">
									<div class="flex items-center justify-between">
										<div class="space-y-1">
											<Label for="auto-approve">Auto-Approve Requests</Label>
											<p class="text-sm text-gray-600 dark:text-gray-400">
												Automatically approve join requests without review
											</p>
										</div>
										<Switch id="auto-approve" bind:checked={autoApproveJoinRequests} />
									</div>

									<div>
										<Label for="default-role">Default Role for New Members</Label>
										<Select.Root type="single" bind:value={defaultJoinRole}>
											<Select.Trigger class="w-[180px]">
												{defaultJoinRoleTriggerContent}
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
								</div>
							{/if}
						</div>
					{/if}
				</Card.Content>
			</Card.Root>

			<!-- Actions -->
			<div class="flex justify-between">
				<Button
					variant="destructive"
					onclick={openDeleteDialog}
					class="flex items-center gap-2"
				>
					<Trash2 class="h-4 w-4" />
					Delete Group
				</Button>

				<Button onclick={saveSettings} disabled={saving} class="flex items-center gap-2">
					<Save class="h-4 w-4" />
					{saving ? 'Saving...' : 'Save Settings'}
				</Button>
			</div>
		</div>
	</section>
</div>

<!-- Delete Confirmation Dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content class="sm:max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2 text-red-600 dark:text-red-400">
				<AlertTriangle class="h-5 w-5" />
				Permanently Delete Group?
			</Dialog.Title>
			<Dialog.Description>
				<div class="space-y-4">
					<p class="font-semibold text-red-600 dark:text-red-400">
						This action is irreversible and will permanently delete the group.
					</p>
					
					<div class="space-y-3">
						<div class="flex items-center gap-3">
							<Switch id="delete-events" bind:checked={deleteEvents} />
							<Label for="delete-events" class="text-sm font-medium">
								Also delete all group events and their data
							</Label>
						</div>
						
						{#if deleteEvents}
							<div class="ml-6 rounded-lg bg-red-50 p-3 dark:bg-red-950/20">
								<p class="text-xs text-red-700 dark:text-red-300">
									⚠️ This will permanently delete ALL events in this group and ALL associated data including messages, files, attendees, and RSVPs.
								</p>
							</div>
						{:else}
							<div class="ml-6 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
								<p class="text-xs text-blue-700 dark:text-blue-300">
									ℹ️ Events will be preserved but unlinked from this group. They will become independent events.
								</p>
							</div>
						{/if}
					</div>

					<div class="space-y-2">
						<p class="text-sm font-medium">
							To confirm deletion, please type the group name:
						</p>
						<p class="rounded bg-gray-100 px-2 py-1 font-mono text-sm dark:bg-gray-800">
							{group.name}
						</p>
						<Input
							bind:value={deleteConfirmationName}
							placeholder="Type the group name here"
							class="font-mono"
						/>
					</div>
				</div>
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer class="flex flex-col gap-2 sm:flex-row">
			<Dialog.Close>
				<Button variant="outline" class="w-full sm:w-auto">
					Cancel
				</Button>
			</Dialog.Close>
			<Button
				variant="destructive"
				onclick={deleteGroup}
				disabled={!deleteButtonEnabled}
				class="flex w-full items-center gap-2 sm:w-auto"
			>
				<Trash2 class="h-4 w-4" />
				{deleting ? 'Deleting...' : 'Delete Group'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>