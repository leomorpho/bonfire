<script lang="ts">
	import GeneratedAvatar from '$lib/components/GeneratedAvatar.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';

	let {
		username,
		fallbackNameShort,
		isTempUser = false,
		fullsizeUrl = null,
		url = null,
		baseHeightPx = 50,
		numGuests = 0
	} = $props();
</script>

{#snippet numGuestOnAvatar(num: number)}
	<div
		class="absolute -bottom-1 left-4 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-md"
	>
		+{num}
	</div>
{/snippet}

{#if fullsizeUrl || url}
	<div class="relative">
		<Avatar.Root
			class={`relative ${isTempUser ? 'border-yellow-300' : 'border-white'}`}
			style="height: {baseHeightPx}px; width: {baseHeightPx}px;"
		>
			<!-- Avatar Image -->
			<Avatar.Image src={url as string} alt={username as string} class="h-full w-full" />

			<!-- Fallback Text -->
			<Avatar.Fallback class="absolute inset-0 flex items-center justify-center text-base">
				{fallbackNameShort}
			</Avatar.Fallback>

			<!-- Overlay Layer for Temp User -->
			{#if isTempUser}
				<div class="pointer-events-none absolute inset-0 bg-yellow-300 opacity-40"></div>
			{/if}
		</Avatar.Root>
		{#if numGuests > 0}
			{@render numGuestOnAvatar(numGuests)}
		{/if}
	</div>
{:else}
	<div class="relative">
		<GeneratedAvatar {username} size={baseHeightPx} />
		{#if isTempUser}
			<div class="pointer-events-none absolute inset-0 rounded-full border-4 border-yellow-400">
				<div class="flex h-full w-full items-center justify-center text-base">
					{fallbackNameShort}
				</div>
			</div>
		{:else}
			<div class="pointer-events-none absolute inset-0 rounded-full">
				<div class="flex h-full w-full items-center justify-center text-base">
					{fallbackNameShort}
				</div>
			</div>
		{/if}
		{#if numGuests > 0}
			{@render numGuestOnAvatar(numGuests)}
		{/if}
	</div>
{/if}
