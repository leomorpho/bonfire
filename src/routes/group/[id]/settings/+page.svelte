<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { ArrowLeft, Save, Trash2, Globe, Lock } from 'lucide-svelte';
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

	// Role options for join requests
	const roleOptions = [
		{ value: 'member', label: 'Member' },
		{ value: 'event_manager', label: 'Event Manager' }
	];

	const defaultJoinRoleTriggerContent = $derived(
		roleOptions.find((r) => r.value === defaultJoinRole)?.label ?? 'Select role'
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
		if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
			return;
		}

		deleting = true;
		try {
			const response = await fetch(`/api/groups/${group.id}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (response.ok) {
				toast.success('Group deleted successfully');
				goto('/groups');
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
					onclick={deleteGroup}
					disabled={deleting}
					class="flex items-center gap-2"
				>
					<Trash2 class="h-4 w-4" />
					{deleting ? 'Deleting...' : 'Delete Group'}
				</Button>

				<Button onclick={saveSettings} disabled={saving} class="flex items-center gap-2">
					<Save class="h-4 w-4" />
					{saving ? 'Saving...' : 'Save Settings'}
				</Button>
			</div>
		</div>
	</section>
</div>