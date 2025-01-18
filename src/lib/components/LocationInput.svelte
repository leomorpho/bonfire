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

	let { location = $bindable<string | undefined>(), geocodedLocation = $bindable<any>() } =
		$props();

	const originalLocation = location;
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
		if (triggerRef && inputRef) {
			const triggerWidth = triggerRef.offsetWidth;
			inputRef.style.width = `${triggerWidth}px`;
		}
	});

	$effect(() => {
		console.log('selectedResult', selectedResult);
	});
	const enterEventLocationText = 'Enter event address...';

	let selectedValue = $state(location);

	$effect(() => {
		if (selectedResult?.formattedAddress) {
			selectedValue = selectedResult?.formattedAddress;
			geocodedLocation = selectedResult;
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
	const fetchSuggestions = debounce(async (query: string) => {
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

			console.log('Response Data:', responseData); // Inspect the full response

			// Check the response type
			if (responseData.type === 'geocode') {
				suggestions = responseData.results.map((res: any) => ({
					label: res.formattedAddress,
					value: { type: 'geocode', data: res }
				}));
			} else if (responseData.type === 'places') {
				suggestions = responseData.results.map((res: any) => ({
					label: `<div><strong>${res.name}</strong><br>${res.address}</div>`,
					// simpleLabel: res.name,
					value: { type: 'places', data: res }
				}));
			} else {
				errorMessage = 'Unexpected response type.';
				suggestions = [];
			}
		} catch (error) {
			console.error('Failed to fetch suggestions:', error);
			errorMessage = 'Unable to fetch suggestions.';
			suggestions = [];
		} finally {
			loading = false;
		}
	}, 500); // Debounce with a 300ms delay
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef}>
		{#snippet child({ props })}
			<Button
				variant="outline"
				class="h-fit w-full flex-wrap justify-between whitespace-normal break-words"
				{...props}
				role="combobox"
				aria-expanded={open}
			>
				{@html selectedValue || enterEventLocationText}
				<ChevronsUpDown class="opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-full p-0">
		<Command.Root>
			<Input
				type="text"
				placeholder="1600 Pennsylvania Avenue, Washington DC"
				class="h-[var(--trigger-height)] bg-white"
				bind:value={locationQueryStr}
				bind:ref={inputRef}
				oninput={() => fetchSuggestions(locationQueryStr)}
			/>
			<Command.List>
				<Command.Group>
					{#if loading}
						<Command.Item>Loading...</Command.Item>
					{:else if errorMessage}
						<Command.Item>{errorMessage}</Command.Item>
					{:else if suggestions.length > 0}
						{#each suggestions as suggestion}
							<Command.Item
								value={suggestion.label}
								onSelect={() => {
									selectedResult = suggestion.value; // Save full object
									location = suggestion.label; // Display label
									geocodedLocation = suggestion.value;
									closeAndFocusTrigger();
								}}
							>
								<Check class={cn(selectedResult !== suggestion.value && 'text-transparent')} />
								<span
									class="dropdown-item-content"
									class:active={selectedResult === suggestion.value}
								>
									{@html suggestion.label}
								</span>
							</Command.Item>
						{/each}
					{:else if selectedValue != originalLocation}
						<Command.Item
							onSelect={() => {
								selectedResult = { formattedAddress: location }; // Save custom address
								closeAndFocusTrigger();
							}}
						>
							Use custom address: "{location}"
						</Command.Item>
					{/if}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
