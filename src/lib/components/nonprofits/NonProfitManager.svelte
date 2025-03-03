<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import Datepicker from '$lib/components/Datepicker.svelte';
	import { fromDate, type DateValue, getLocalTimeZone } from '@internationalized/date';
	import { onMount } from 'svelte';
	import type { TriplitClient } from '@triplit/client';
	import { toast } from 'svelte-sonner';
	import { Plus, Pencil, Trash } from 'lucide-svelte';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';

	const emptyForm = {
		id: '',
		name: '',
		description: '',
		photo_url: '',
		website_url: '',
		effective_start_date: null,
		effective_end_date: null
	};

	let client: TriplitClient;
	let nonProfits = $state([]);
	let loading = $state(true);
	let form = $state(emptyForm);

	let createBtnEnabled = $derived(
		form.name && form.description && form.photo_url && form.website_url && form.effective_start_date
	);
	let isCreateAlertDialogOpen = $state(false);
	let isUpdateAlertDialogOpen = $state(false);

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
	const createNonProfit = async () => {
		try {
			await client.insert('non_profits', {
				name: form.name,
				description: form.description,
				photo_url: form.photo_url || null,
				website_url: form.website_url,
				effective_start_date: form.effective_start_date
					? new Date(form.effective_start_date).toISOString()
					: null,
				effective_end_date: form.effective_end_date
					? new Date(form.effective_end_date).toISOString()
					: null
			});
			toast.success('Successfully created non-profit');
		} catch (e) {
			console.error('Error creating non-profit:', e);
			toast.error('Failed to create non-profit');
		}
		isCreateAlertDialogOpen = false;
	};

	const updateNonProfit = async () => {
		try {
			const effectiveStartDate = form.effective_start_date
				? new Date(form.effective_start_date.toDate(getLocalTimeZone()))
				: null;
			const effectiveEndDate = form.effective_end_date
				? new Date(form.effective_end_date.toDate(getLocalTimeZone()))
				: null;

			if (form.id) {
				await client.update('non_profits', form.id, async (entity) => {
					entity.name = form.name;
					entity.description = form.description;
					entity.photo_url = form.photo_url || null;
					entity.website_url = form.website_url;
					entity.effective_start_date = effectiveStartDate;
					entity.effective_end_date = effectiveEndDate;
				});
				toast.success('Non-profit updated successfully!');
			} else {
				await client.insert('non_profits', {
					...form,
					effective_start_date: effectiveStartDate,
					effective_end_date: effectiveEndDate
				});
				toast.success('Non-profit created successfully!');
			}
		} catch (error) {
			console.error('Error saving non-profit:', error);
			toast.error('Failed to save non-profit');
		}
		isUpdateAlertDialogOpen = false;
	};

	function dateToDateValue(date: Date | null): DateValue | undefined {
		if (!date) return undefined;
		return fromDate(date, getLocalTimeZone());
	}

	const openCreateForm = () => {
		form = emptyForm;
		isCreateAlertDialogOpen = true;
	};

	const openUpdateForm = (nonProfit) => {
		console.log('nonProfit', nonProfit);
		isUpdateAlertDialogOpen = true;

		form = {
			id: nonProfit.id,
			name: nonProfit.name,
			description: nonProfit.description,
			photo_url: nonProfit.photo_url,
			website_url: nonProfit.website_url,
			effective_start_date: dateToDateValue(nonProfit.effective_start_date),
			effective_end_date: dateToDateValue(nonProfit.effective_end_date)
		};
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

<AlertDialog.Root bind:open={isUpdateAlertDialogOpen} interactOutsideBehavior="close">
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Edit Non-Profit</AlertDialog.Title>
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
			<AlertDialog.Action onclick={(e) => updateNonProfit()}>Update</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root bind:open={isCreateAlertDialogOpen}>
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
			<AlertDialog.Action onclick={(e) => createNonProfit()} disabled={!createBtnEnabled}
				>Create</AlertDialog.Action
			>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
<div class="flex flex-col items-center justify-center p-6">
	<h2 class="mb-4 text-center text-2xl font-bold">Manage Non-Profits</h2>

	<!-- Create Button -->
	<Button class="mb-6" onclick={openCreateForm}>
		<Plus class="mr-2" /> Add Non-Profit
	</Button>

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
							Effective:
							{nonProfit.effective_start_date
								? new Date(nonProfit.effective_start_date).toISOString().split('T')[0]
								: 'Unknown'}
							-
							{nonProfit.effective_end_date
								? new Date(nonProfit.effective_end_date).toISOString().split('T')[0]
								: 'Ongoing'}
						</p>
					</Card.Content>
					<Card.Footer class="flex justify-between">
						<!-- Edit Button -->
						<Button variant="outline" onclick={() => openUpdateForm(nonProfit)}>
							<Pencil class="mr-1" /> Edit
						</Button>

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
										onclick={(e) => deleteNonProfit(nonProfit.id, e.detail.close)}
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
