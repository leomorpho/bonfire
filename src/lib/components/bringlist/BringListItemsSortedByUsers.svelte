<script lang="ts">
	import type { BringItem } from '$lib/types';
	import { fade } from 'svelte/transition';
	import ProfileAvatar from '../profile/profile-avatar/ProfileAvatar.svelte';
	import IndividualBringListItem from './items/IndividualBringListItem.svelte';
	import { flip } from 'svelte/animate';
	import BonfireNoInfoCard from '../BonfireNoInfoCard.svelte';

	let { userItemsMap, tempAttendeeItemsMap } = $props();

	let selectedUserId = $state<string | null>(null);
	let isSelectedUserTemp = $state(false);
	let filteredItems: Array<BringItem> = $state([]);

	// Watch for changes in selectedUserId and update filteredItems
	$effect(() => {
		if (selectedUserId) {
			if (isSelectedUserTemp) {
				filteredItems = tempAttendeeItemsMap[selectedUserId] || [];
			} else {
				filteredItems = userItemsMap[selectedUserId] || [];
			}
		} else {
			filteredItems = [];
		}
	});

	let selectedUserKey = $state('');

	$effect(() => {
		// Force re-render of ProfileAvatar when selectedUserId or isSelectedUserTemp changes
		selectedUserKey = `${selectedUserId}-${isSelectedUserTemp}`;
	});
</script>

<div class="my-2">
	<div class="mx-5 flex flex-wrap -space-x-2 text-black">
		{#each Object.keys(tempAttendeeItemsMap) as tempUserId (`tempuser-${tempUserId}`)}
			<button
				animate:flip
				out:fade={{ duration: 300 }}
				onclick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					selectedUserId = tempUserId;
					isSelectedUserTemp = true;
				}}
			>
				<ProfileAvatar {tempUserId} baseHeightPx={40} onlyShowPhoto={true} />
			</button>
		{/each}
	</div>
	<div class="mx-5 flex flex-wrap -space-x-2 text-black">
		{#each Object.keys(userItemsMap) as userId (`user-${userId}`)}
			<button
				animate:flip
				out:fade={{ duration: 300 }}
				onclick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					selectedUserId = userId;
					isSelectedUserTemp = false;
				}}
			>
				<ProfileAvatar {userId} baseHeightPx={40} onlyShowPhoto={true} />
			</button>
		{/each}
	</div>

	{#if selectedUserId}
		<div class="mt-4" in:fade={{ duration: 300 }} out:fade={{ duration: 0 }}>
			<h3 class="mb-2 flex w-full items-center justify-center text-xs font-semibold">
				Items brought by
				{#key selectedUserKey}
					<span class="ml-1" in:fade={{ duration: 300 }} out:fade={{ duration: 0 }}>
						<ProfileAvatar
							baseHeightPx={30}
							userId={isSelectedUserTemp ? null : selectedUserId}
							tempUserId={isSelectedUserTemp ? selectedUserId : null}
						/>
					</span>
				{/key}
			</h3>
			{#if filteredItems.length > 0}
				{#each filteredItems as item (`${selectedUserId}-${item.id}`)}
					<IndividualBringListItem
						itemName={item.name}
						itemUnit={item.unit}
						numBrought={item.bring_assignments?.[0]?.quantity ?? 0}
					/>
				{/each}
			{:else}
				<p>No items brought by this user.</p>
			{/if}
		</div>
	{:else}
		<BonfireNoInfoCard class="mt-2" text={'Select someone in the above list'} />
	{/if}
</div>
