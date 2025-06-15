<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Card } from '$lib/components/ui/card';
	import type { FlowData } from '../flow-enums';
	import { Users, Camera, MessageCircle, Gift, Calendar, UserCheck } from 'lucide-svelte';

	let { data }: { data: FlowData } = $props();

	// Initialize with defaults
	let maxCapacity = $state(data.maxCapacity);
	let maxNumGuests = $state(data.maxNumGuests || 0);
	let isBringListEnabled = $state(data.isBringListEnabled ?? false);
	let isGalleryEnabled = $state(data.isGalleryEnabled ?? true);
	let isMessagingEnabled = $state(data.isMessagingEnabled ?? true);
	let requireGuestBringItem = $state(data.requireGuestBringItem ?? false);

	// Update data when options change
	$effect(() => {
		data.maxCapacity = maxCapacity;
		data.maxNumGuests = data.isPaid ? 0 : maxNumGuests; // No guests for paid events
		data.isBringListEnabled = isBringListEnabled;
		data.isGalleryEnabled = isGalleryEnabled;
		data.isMessagingEnabled = isMessagingEnabled;
		data.requireGuestBringItem = requireGuestBringItem;
	});
</script>

<div class="space-y-6">
	<!-- Capacity Settings -->
	<Card class="p-4">
		<h3 class="font-semibold mb-4 flex items-center gap-2">
			<Users class="h-5 w-5" />
			Capacity & Guests
		</h3>
		
		<div class="space-y-4">
			<div>
				<Label for="max-capacity">Maximum attendees (optional)</Label>
				<Input
					id="max-capacity"
					type="number"
					bind:value={maxCapacity}
					placeholder="Leave blank for unlimited"
					min="1"
					class="mt-1"
				/>
				<p class="text-xs text-gray-500 mt-1">
					Set a limit on how many people can attend your event
				</p>
			</div>

			{#if !data.isPaid}
				<div>
					<Label for="max-guests">Guests per attendee</Label>
					<Input
						id="max-guests"
						type="number"
						bind:value={maxNumGuests}
						min="0"
						max="10"
						class="mt-1"
					/>
					<p class="text-xs text-gray-500 mt-1">
						How many guests can each attendee bring?
					</p>
				</div>

				{#if maxNumGuests && maxNumGuests > 0}
					<div class="flex items-center space-x-2">
						<Switch bind:checked={requireGuestBringItem} />
						<Label for="require-guest-item" class="text-sm">
							Guests must bring something from the bring list
						</Label>
					</div>
				{/if}
			{:else}
				<div class="p-3 bg-amber-50 dark:bg-amber-950 rounded text-sm text-amber-700 dark:text-amber-300">
					💳 Paid events don't allow plus-ones to simplify ticket management
				</div>
			{/if}
		</div>
	</Card>

	<!-- Event Features -->
	<Card class="p-4">
		<h3 class="font-semibold mb-4">Event Features</h3>
		
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<Gift class="h-5 w-5 text-green-500" />
					<div>
						<Label class="text-sm font-medium">Bring List</Label>
						<p class="text-xs text-gray-500">Let attendees coordinate what to bring</p>
					</div>
				</div>
				<Switch bind:checked={isBringListEnabled} />
			</div>

			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<Camera class="h-5 w-5 text-blue-500" />
					<div>
						<Label class="text-sm font-medium">Photo Gallery</Label>
						<p class="text-xs text-gray-500">Allow attendees to share photos</p>
					</div>
				</div>
				<Switch bind:checked={isGalleryEnabled} />
			</div>

			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<MessageCircle class="h-5 w-5 text-purple-500" />
					<div>
						<Label class="text-sm font-medium">Event Chat</Label>
						<p class="text-xs text-gray-500">Enable messaging between attendees</p>
					</div>
				</div>
				<Switch bind:checked={isMessagingEnabled} />
			</div>
		</div>
	</Card>

	<!-- Summary -->
	<div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
		<h4 class="font-medium mb-2">Event Summary</h4>
		<div class="text-sm space-y-1 text-gray-600 dark:text-gray-400">
			<p>• <strong>{data.eventName || 'Untitled Event'}</strong></p>
			<p>• {data.isPaid ? 'Paid event' : 'Free event'}</p>
			{#if maxCapacity}
				<p>• Max {maxCapacity} attendees</p>
			{:else}
				<p>• Unlimited attendees</p>
			{/if}
			{#if !data.isPaid && maxNumGuests && maxNumGuests > 0}
				<p>• Up to {maxNumGuests} guest{maxNumGuests > 1 ? 's' : ''} per attendee</p>
			{/if}
			<p>• Features: {[
				isBringListEnabled ? 'Bring List' : null,
				isGalleryEnabled ? 'Gallery' : null,
				isMessagingEnabled ? 'Chat' : null
			].filter(Boolean).join(', ') || 'None selected'}</p>
		</div>
	</div>
</div>