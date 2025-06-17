<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { ArrowLeft, Building2, Save } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { getFeWorkerTriplitClient, waitForUserId } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';

	let client: TriplitClient;
	let isSubmitting = $state(false);

	// Form fields
	let name = $state('');
	let description = $state('');
	let website_url = $state('');
	let is_public = $state(false);

	// Form validation
	let nameError = $state('');
	let isFormValid = $derived(name.trim().length > 0 && !nameError);

	function validateName() {
		if (name.trim().length === 0) {
			nameError = 'Group name is required';
		} else if (name.trim().length < 3) {
			nameError = 'Group name must be at least 3 characters';
		} else if (name.trim().length > 100) {
			nameError = 'Group name must be less than 100 characters';
		} else {
			nameError = '';
		}
	}

	function validateWebsite() {
		if (website_url.trim() && !website_url.startsWith('http')) {
			website_url = 'https://' + website_url;
		}
	}

	async function handleSubmit() {
		if (!isFormValid || isSubmitting) return;

		isSubmitting = true;
		try {
			const userId = await waitForUserId();
			if (!userId) {
				toast.error('Authentication required');
				return;
			}

			// Create group
			const groupId = crypto.randomUUID();
			await client.insert('groups', {
				id: groupId,
				name: name.trim(),
				description: description.trim() || null,
				website_url: website_url.trim() || null,
				created_by_user_id: userId as string,
				is_public
			});

			// Add creator as admin
			await client.insert('group_members', {
				id: crypto.randomUUID(),
				group_id: groupId,
				user_id: userId as string,
				role: 'admin',
				added_by_user_id: userId as string
			});

			toast.success('Group created successfully!');
			goto(`/group/${groupId}`);
		} catch (error) {
			console.error('Error creating group:', error);
			toast.error('Failed to create group. Please try again.');
		} finally {
			isSubmitting = false;
		}
	}

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;
	});
</script>

<svelte:head>
	<title>Create Group - Bonfire</title>
	<meta name="description" content="Create a new group to group your events" />
</svelte:head>

<div class="mx-4 mb-48 flex flex-col items-center justify-center sm:mb-20">
	<section class="mt-8 w-full sm:w-2/3 md:w-[700px]">
		<!-- Header -->
		<div class="mb-8">
			<Button variant="ghost" onclick={() => goto('/groups')} class="-ml-4 mb-4">
				<ArrowLeft class="mr-2 h-4 w-4" />
				Back to Groups
			</Button>

			<h1 class="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Create Group</h1>
			<p class="text-gray-600 dark:text-gray-400">
				Set up a new group to group and manage your events
			</p>
		</div>

		<!-- Form -->
		<div class="rounded-lg bg-slate-200 p-8 dark:bg-slate-800">
			<div class="mb-6">
				<h2
					class="mb-2 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white"
				>
					<Building2 class="h-5 w-5" />
					Group Details
				</h2>
				<p class="text-gray-600 dark:text-gray-400">
					Provide basic information about your group
				</p>
			</div>

			<div class="space-y-6">
				<!-- Group Name -->
				<div class="space-y-2">
					<Label for="name">Group Name *</Label>
					<Input
						id="name"
						bind:value={name}
						oninput={validateName}
						placeholder="Enter group name"
						class={nameError ? 'border-red-500' : ''}
						disabled={isSubmitting}
					/>
					{#if nameError}
						<p class="text-sm text-red-600 dark:text-red-400">{nameError}</p>
					{/if}
				</div>

				<!-- Description -->
				<div class="space-y-2">
					<Label for="description">Description</Label>
					<Textarea
						id="description"
						bind:value={description}
						placeholder="Describe your group (optional)"
						class="min-h-[100px]"
						disabled={isSubmitting}
					/>
				</div>

				<!-- Website URL -->
				<div class="space-y-2">
					<Label for="website">Website</Label>
					<Input
						id="website"
						bind:value={website_url}
						onblur={validateWebsite}
						placeholder="https://example.com"
						disabled={isSubmitting}
					/>
				</div>

				<!-- Public/Private -->
				<div class="flex items-center space-x-2">
					<Checkbox id="public" bind:checked={is_public} disabled={isSubmitting} />
					<Label for="public" class="text-sm font-normal">
						Make this group public (anyone can view it and its events)
					</Label>
				</div>

				<!-- Submit Button -->
				<div class="flex gap-3 pt-6">
					<Button
						variant="outline"
						onclick={() => goto('/groups')}
						disabled={isSubmitting}
						class="flex-1"
					>
						Cancel
					</Button>
					<Button onclick={handleSubmit} disabled={!isFormValid || isSubmitting} class="flex-1">
						{#if isSubmitting}
							<div
								class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
							></div>
							Creating...
						{:else}
							<Save class="mr-2 h-4 w-4" />
							Create Group
						{/if}
					</Button>
				</div>
			</div>
		</div>
	</section>
</div>
