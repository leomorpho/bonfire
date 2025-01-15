<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { formatHumanReadable } from '$lib/utils';
	import GeneratedAvatar from './GeneratedAvatar.svelte';

	let {
		url,
		fullsizeUrl = null,
		fallbackName = '',
		username,
		isTempUser = false,
		lastUpdatedAt = null
	} = $props();

	const fallbackNameShort = fallbackName.slice(0, 2);
</script>

<Dialog.Root>
	<Dialog.Trigger>
		{#if fullsizeUrl || url}
			<Avatar.Root
				class="relative h-12 w-12 border-2 sm:h-14 sm:w-14 {isTempUser
					? 'border-yellow-300'
					: 'border-white'}"
			>
				<!-- Avatar Image -->
				<Avatar.Image src={url} alt={username} class="h-full w-full" />

				<!-- Fallback Text -->
				<Avatar.Fallback class="absolute inset-0 flex items-center justify-center">
					{fallbackNameShort}
				</Avatar.Fallback>

				<!-- Overlay Layer for Temp User -->
				{#if isTempUser}
					<div class="pointer-events-none absolute inset-0 bg-yellow-300 opacity-40"></div>
				{/if}
			</Avatar.Root>
		{:else}
			<div class="relative">
				<GeneratedAvatar {username} />
				{#if isTempUser}
					<div class="pointer-events-none absolute inset-0 rounded-full border-yellow-400 border-4">
						<div class="flex h-full w-full items-center justify-center">{fallbackNameShort}</div>
					</div>
				{:else}
					<div class="pointer-events-none absolute inset-0 rounded-full">
						<div class="flex h-full w-full items-center justify-center">{fallbackNameShort}</div>
					</div>
				{/if}
			</div>
		{/if}
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title class="flex justify-center">{username}</Dialog.Title>
			<Dialog.Description>
				{#if isTempUser}
					<div class="m-3 flex justify-center rounded-lg bg-yellow-400 p-2 text-black">
						Temporary account
					</div>
				{/if}
				{#if lastUpdatedAt}
					<div class="flex justify-center">Last updated {formatHumanReadable(lastUpdatedAt)}</div>
				{/if}
				{#if fullsizeUrl || url}
					<Avatar.Root class="mt-3 h-full w-full">
						<Avatar.Image src={fullsizeUrl ? fullsizeUrl : url} alt={username} />
						<Avatar.Fallback>{fallbackNameShort}</Avatar.Fallback>
						<!-- Overlay Layer for Temp User -->
					</Avatar.Root>
				{:else}
					<div class="mb-10 flex h-full w-full items-center justify-center text-3xl md:text-4xl text-black">
						<div class="relative">
							<GeneratedAvatar {username} size={200} />
							{#if isTempUser}
								<div
									class="pointer-events-none absolute inset-0 rounded-full border-yellow-400 border-8"
								>
									<div class="flex h-full w-full items-center justify-center">
										{fallbackNameShort}
									</div>
								</div>
							{:else}
								<div class="pointer-events-none absolute inset-0 rounded-full">
									<div class="flex h-full w-full items-center justify-center">
										{fallbackNameShort}
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<Dialog.Footer></Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
