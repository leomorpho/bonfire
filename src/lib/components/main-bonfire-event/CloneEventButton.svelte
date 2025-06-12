<script lang="ts">
	import { Copy } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';

	let { eventId, eventTitle, class: cls = null } = $props();

	let open = $state(false);
	let cloneName = $state(`${eventTitle} (Copy)`);
	let copyAttendees = $state(false);
	let copyBringList = $state(false); // Default to false - user must explicitly choose
	let isCloning = $state(false);

	async function handleClone() {
		if (!cloneName.trim()) {
			toast.error('Please enter a name for the cloned event');
			return;
		}

		isCloning = true;
		
		try {
			const response = await fetch(`/bonfire/${eventId}/clone`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					cloneName: cloneName.trim(),
					copyAttendees,
					copyBringList
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to clone event');
			}

			const result = await response.json();
			
			toast.success('Event cloned successfully!');
			open = false;
			
			// Redirect to the cloned event's edit page
			goto(`/bonfire/${result.clonedEventId}/update`);
			
		} catch (error) {
			console.error('Error cloning event:', error);
			toast.error(error.message || 'Failed to clone event');
		} finally {
			isCloning = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger asChild>
		{#snippet child({ props })}
			<div class="flex w-full justify-center">
				<button 
					{...props}
					class="relative {cls}"
					title="Clone this event"
				>
					<div class="flex items-center justify-center">
						<Copy class="h-6 w-6" />
					</div>
				</button>
			</div>
		{/snippet}
	</Dialog.Trigger>
	
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Clone Event</Dialog.Title>
			<Dialog.Description>
				This will create a copy of the event with a new ID. The clone will be unpublished and you'll be the creator.
			</Dialog.Description>
		</Dialog.Header>
		
		{#if isCloning}
			<!-- Loading State -->
			<div class="flex flex-col items-center justify-center py-8 space-y-4">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<div class="text-center space-y-2">
					<p class="text-sm font-medium">Cloning event...</p>
					<p class="text-xs text-muted-foreground">
						This might take a while if there's a lot of data to copy.
					</p>
				</div>
			</div>
		{:else}
			<!-- Form State -->
			<div class="grid gap-4 py-4">
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="clone-name" class="text-right">
						Name
					</Label>
					<Input
						id="clone-name"
						bind:value={cloneName}
						class="col-span-3"
						placeholder="Enter name for cloned event"
						disabled={isCloning}
					/>
				</div>
				
				<div class="mt-4 space-y-3">
					<div class="flex items-center space-x-2">
						<Checkbox 
							id="copy-attendees" 
							bind:checked={copyAttendees}
							disabled={isCloning}
						/>
						<Label 
							for="copy-attendees" 
							class="cursor-pointer text-sm font-normal {isCloning ? 'opacity-50' : ''}"
						>
							Copy attendees (all RSVPs will be copied)
						</Label>
					</div>
					
					<div class="flex items-center space-x-2">
						<Checkbox 
							id="copy-bring-list" 
							bind:checked={copyBringList}
							disabled={isCloning}
						/>
						<Label 
							for="copy-bring-list" 
							class="cursor-pointer text-sm font-normal {isCloning ? 'opacity-50' : ''}"
						>
							Copy bring list items (without assignments)
						</Label>
					</div>
				</div>
			</div>
		{/if}
		
		<Dialog.Footer>
			<Button 
				variant="outline" 
				onclick={() => open = false}
				disabled={isCloning}
			>
				Cancel
			</Button>
			<Button 
				onclick={handleClone}
				disabled={isCloning || !cloneName.trim()}
			>
				{isCloning ? 'Cloning...' : 'Clone Event'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>