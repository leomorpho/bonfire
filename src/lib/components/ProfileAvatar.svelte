<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { formatHumanReadable } from '$lib/utils';

	let { url, fullsizeUrl = null, fallbackName = '', username, isTempUser = false , lastUpdatedAt=null} = $props();
</script>

<Dialog.Root>
	<Dialog.Trigger
		><Avatar.Root
			class="relative h-12 w-12 border-2 sm:h-14 sm:w-14 {isTempUser
				? 'border-yellow-300'
				: 'border-white'}"
		>
			<!-- Avatar Image -->
			<Avatar.Image src={url} alt={username} class="h-full w-full" />

			<!-- Fallback Text -->
			<Avatar.Fallback class="absolute inset-0 flex items-center justify-center">
				{fallbackName.slice(0, 2)}
			</Avatar.Fallback>

			<!-- Overlay Layer for Temp User -->
			{#if isTempUser}
				<div class="pointer-events-none absolute inset-0 bg-yellow-300 opacity-40"></div>
			{/if}
		</Avatar.Root></Dialog.Trigger
	>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title class="justify-center flex">{username}</Dialog.Title>
			<Dialog.Description>
				{#if isTempUser}
					<div class="rounded-lg bg-blue-300 p-2 flex justify-center text-white m-3">Temporary account</div>
				{/if}
				{#if lastUpdatedAt}
				<div class="flex justify-center">Last updated {formatHumanReadable(lastUpdatedAt)}</div>
				{/if}
				{#if fullsizeUrl || url}
					<Avatar.Root class="h-full w-full mt-3">
						<Avatar.Image src={fullsizeUrl ? fullsizeUrl : url} alt={username} />
						<Avatar.Fallback>{fallbackName.slice(0, 2)}</Avatar.Fallback>
						<!-- Overlay Layer for Temp User -->
					</Avatar.Root>
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<Dialog.Footer></Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
