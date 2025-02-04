<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { debounce } from '$lib/utils';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';

	let { onclick, location = $bindable<string | undefined>(), geocodedLocation = $bindable<any>() } =
		$props();

	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);
	let loading = $state(false);
	let errorMessage = $state('');
	let suggestions: { label: string; value: any }[] = $state([]);
	let selectedResult: any = $state(null);
	let inputRef = $state<HTMLInputElement>(null!);
	let locationQueryStr = $state('');

	// Synchronize input height with trigger button
	$effect(() => {
		resizeInputBox();
	});

	const resizeInputBox = () => {
		if (triggerRef && inputRef) {
			const triggerWidth = triggerRef.offsetWidth;
			inputRef.style.width = `${triggerWidth}px`;
		}
	};

	// $effect(() => {
	// 	console.log('selectedResult', selectedResult);
	// });
	const enterEventLocationText = 'Enter event address...';

	let selectedValue = $state(location);

	$effect(() => {
		if (selectedResult?.formattedAddress) {
			selectedValue = selectedResult?.formattedAddress;
		} else if (location) {
			selectedValue = location;
		} else {
			selectedValue = enterEventLocationText;
		}
	});

	$effect(() => {
		if (location && geocodedLocation) {
			console.log('location', location);
			console.log('geocodedLocation', geocodedLocation);
		}
	});

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}

	// Function to fetch suggestions from the backend
	const fetchSuggestions = async (query: string) => {
		if (!query) {
			suggestions = [];
			return;
		}

		loading = true;
		errorMessage = '';
		try {
			const response = await fetch('/bonfire/create/geocode', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ address: query })
			});

			if (!response.ok) {
				const error = await response.json();
				errorMessage = error.error || 'An error occurred.';
				suggestions = [];
				loading = false;
				return;
			}

			const responseData = await response.json();

			// console.log('Response Data:', responseData); // Inspect the full response

			// Check the response type
			if (responseData.type === 'geocode') {
				suggestions = responseData.results.map((res: any) => ({
					label: res.formattedAddress,
					value: { type: 'geocode', data: res }
				}));
			} else if (responseData.type === 'places') {
				suggestions = responseData.results.map((res: any) => ({
					label: `<div><strong>${res.name}</strong><br><div class="flex text-wrap break-words">${res.address}</div></div>`,
					// simpleLabel: res.name,
					value: { type: 'places', data: res }
				}));
			} else {
				errorMessage = 'Unexpected response type.';
				suggestions = [];
			}
			resizeInputBox();
		} catch (error) {
			console.error('Failed to fetch suggestions:', error);
			errorMessage = 'Unable to fetch suggestions.';
			suggestions = [];
		} finally {
			loading = false;
		}
	}; // Debounce with a 300ms delay
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef} onclick={resizeInputBox}>
		{#snippet child({ props })}
			<Button
				variant="outline"
				class="h-fit w-full flex-wrap justify-between whitespace-normal break-words dark:bg-slate-900"
				{...props}
				role="combobox"
				aria-expanded={open}
			>
				{@html selectedValue || enterEventLocationText}
				<ChevronsUpDown class="opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="bg-slate-100 p-0">
		<Command.Root>
			<Input
				type="text"
				placeholder="1600 Pennsylvania Avenue, Washington DC"
				class="h-[var(--trigger-height)]"
				bind:value={locationQueryStr}
				bind:ref={inputRef}
				oninput={() => debounce(fetchSuggestions)(locationQueryStr)}
			/>
			<Command.List>
				<Command.Group>
					{#if locationQueryStr.length > 0}
						<Command.Item
							class="flex justify-center text-wrap font-semibold text-blue-800"
							onSelect={() => {
								selectedResult = { formattedAddress: locationQueryStr }; // Save custom address
								location = locationQueryStr;
								closeAndFocusTrigger();
							}}
						>
							Use custom place: "{locationQueryStr}"
						</Command.Item>
					{/if}
					{#if loading}
						<Command.Item>Loading...</Command.Item>
					{:else if errorMessage}
						<Command.Item>{errorMessage}</Command.Item>
					{:else}
						{#each suggestions as suggestion}
							<Command.Item
								class="flex max-w-full whitespace-normal text-wrap break-words"
								value={suggestion.label}
								onSelect={() => {
									selectedResult = suggestion.value; // Save full object
									location = suggestion.label; // Display label
									geocodedLocation = suggestion.value;
									closeAndFocusTrigger();
								}}
								{onclick}
							>
								<Check class={cn(selectedResult !== suggestion.value && 'text-transparent')} />
								<span
									class="dropdown-item-content flex text-wrap"
									class:active={selectedResult === suggestion.value}
								>
									{@html suggestion.label}
								</span>
							</Command.Item>
						{/each}
						<div
							class="mt-3 flex max-w-full justify-center whitespace-normal text-wrap break-words"
						>
							<Button
								class="w-full"
								disabled={locationQueryStr.length == 0}
								onclick={() => fetchSuggestions(locationQueryStr)}>Search</Button
							>
						</div>
					{/if}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
