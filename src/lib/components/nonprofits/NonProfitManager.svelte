<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import Datepicker from '$lib/components/Datepicker.svelte';

	import { onMount } from 'svelte';
	import type { TriplitClient } from '@triplit/client';
	import { toast } from 'svelte-sonner';
	import { Plus, Pencil, Trash } from 'lucide-svelte';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';

	let client: TriplitClient;
	let nonProfits = $state([]);
	let loading = $state(true);
	let form = $state({
		id: '',
		name: '',
		description: '',
		photo_url: '',
		website_url: '',
		effective_start_date: null,
		effective_end_date: null
	});

	let createBtnEnabled = $derived(
		form.name && form.description && form.photo_url && form.website_url && form.effective_start_date
	);

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribe = client.subscribe(
			client.query('non_profits').order('created_at', 'DESC').build(),
			(results) => {
				nonProfits = results;
				loading = false;
			},
			(error) => {
				console.error('Error fetching non-profits:', error);
				loading = false;
			}
		);

		return () => unsubscribe();
	});

	const saveNonProfit = async (closeDialog: () => void) => {
		try {
			if (form.id) {
				await client.update('non_profits', form.id, async (entity) => {
					entity.name = form.name;
					entity.description = form.description;
					entity.photo_url = form.photo_url || null;
					entity.website_url = form.website_url;
					entity.effective_start_date = form.effective_start_date;
					entity.effective_end_date = form.effective_end_date || null;
				});
				toast.success('Non-profit updated successfully!');
			} else {
				await client.insert('non_profits', form);
				toast.success('Non-profit created successfully!');
			}
			closeDialog();
		} catch (error) {
			console.error('Error saving non-profit:', error);
			toast.error('Failed to save non-profit');
		}
	};

	const deleteNonProfit = async (id: string, closeDialog: () => void) => {
		try {
			await client.delete('non_profits', id);
			toast.success('Non-profit deleted successfully!');
			closeDialog();
		} catch (error) {
			console.error('Error deleting non-profit:', error);
			toast.error('Failed to delete non-profit');
		}
	};
</script>

<div class="flex flex-col items-center justify-center p-6">
	<h2 class="mb-4 text-center text-2xl font-bold">Manage Non-Profits</h2>

	<!-- Create Button -->
	<AlertDialog.Root>
		<AlertDialog.Trigger>
			<Button class="mb-6">
				<Plus class="mr-2" /> Add Non-Profit
			</Button>
		</AlertDialog.Trigger>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Create Non-Profit</AlertDialog.Title>
			</AlertDialog.Header>
			<div class="space-y-3">
				<Input type="text" placeholder="Name" bind:value={form.name} />
				<Input type="text" placeholder="Description" bind:value={form.description} />
				<Input type="url" placeholder="Photo URL (optional)" bind:value={form.photo_url} />
				<Input type="url" placeholder="Website URL" bind:value={form.website_url} />
				<Datepicker bind:value={form.effective_start_date} label="Start Date" />
				<Datepicker bind:value={form.effective_end_date} label="End Date (optional)" />
			</div>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
				<AlertDialog.Action
					onclick={(e) => saveNonProfit(e.detail.close)}
					disabled={!createBtnEnabled}>Create</AlertDialog.Action
				>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>

	{#if loading}
		<p>Loading...</p>
	{:else if nonProfits.length === 0}
		<p>No non-profits found.</p>
	{:else}
		<div class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
			{#each nonProfits as nonProfit}
				<Card.Root class="mx-auto max-w-sm">
					<Card.Header>
						{#if nonProfit.photo_url}
							<img
								src={nonProfit.photo_url}
								alt={nonProfit.name}
								class="mb-2 h-32 w-full rounded-md object-cover"
							/>
						{/if}
						<Card.Title>{nonProfit.name}</Card.Title>
						<Card.Description>{nonProfit.description}</Card.Description>
					</Card.Header>
					<Card.Content>
						<a href={nonProfit.website_url} target="_blank" class="text-blue-600 hover:underline">
							Visit Website
						</a>
						<p class="text-sm text-gray-600 dark:text-gray-300">
							Effective: {nonProfit.effective_start_date.split('T')[0]} -
							{nonProfit.effective_end_date
								? nonProfit.effective_end_date.split('T')[0]
								: 'Ongoing'}
						</p>
					</Card.Content>
					<Card.Footer class="flex justify-between">
						<!-- Edit Button -->
						<AlertDialog.Root>
							<AlertDialog.Trigger>
								<Button variant="outline" on:click={() => (form = { ...nonProfit })}>
									<Pencil class="mr-1" /> Edit
								</Button>
							</AlertDialog.Trigger>
							<AlertDialog.Content>
								<AlertDialog.Header>
									<AlertDialog.Title>Edit Non-Profit</AlertDialog.Title>
								</AlertDialog.Header>
								<div class="space-y-3">
									<Input type="text" placeholder="Name" bind:value={form.name} />
									<Input type="text" placeholder="Description" bind:value={form.description} />
									<Input
										type="url"
										placeholder="Photo URL (optional)"
										bind:value={form.photo_url}
									/>
									<Input type="url" placeholder="Website URL" bind:value={form.website_url} />
									<Datepicker bind:value={form.effective_start_date} label="Start Date" />
									<Datepicker bind:value={form.effective_end_date} label="End Date (optional)" />
								</div>
								<AlertDialog.Footer>
									<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
									<AlertDialog.Action on:click={(e) => saveNonProfit(e.detail.close)}
										>Update</AlertDialog.Action
									>
								</AlertDialog.Footer>
							</AlertDialog.Content>
						</AlertDialog.Root>

						<!-- Delete Button -->
						<AlertDialog.Root>
							<AlertDialog.Trigger>
								<Button variant="destructive">
									<Trash class="mr-1" /> Delete
								</Button>
							</AlertDialog.Trigger>
							<AlertDialog.Content>
								<AlertDialog.Header>
									<AlertDialog.Title>Are you sure?</AlertDialog.Title>
									<AlertDialog.Description>
										This action cannot be undone. The non-profit will be permanently deleted.
									</AlertDialog.Description>
								</AlertDialog.Header>
								<AlertDialog.Footer>
									<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
									<AlertDialog.Action
										on:click={(e) => deleteNonProfit(nonProfit.id, e.detail.close)}
									>
										Delete
									</AlertDialog.Action>
								</AlertDialog.Footer>
							</AlertDialog.Content>
						</AlertDialog.Root>
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>
