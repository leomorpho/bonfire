<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	// Define the props with default values
	let {
		type = 'info', // Alert types: 'info', 'success', 'warning', 'error', 'dark'
		message = 'This is an alert message.',
		show = true,
		class: classname = null,
		dismissible = true,
		dismissalKey = 'alert-dismissed',
		expireAfterDays = 30, // Default expiration period
		children = null
	} = $props();

	// Define the state for the alert visibility
	let visible = $state(show);

	// Create an event dispatcher to notify parent components
	const dispatch = createEventDispatcher();

	// Function to close the alert
	function closeAlert() {
		visible = false;
		dispatch('close');
		if (dismissible) {
			storeDismissal();
		}
	}

	// Store dismissal state in localStorage with expiration
	function storeDismissal() {
		const expiration = Date.now() + expireAfterDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds
		localStorage.setItem(dismissalKey, JSON.stringify({ dismissed: true, expires: expiration }));
	}

	// Check if the alert was previously dismissed and if the dismissal has expired
	function isDismissed(): boolean {
		const storedData = localStorage.getItem(dismissalKey);
		if (!storedData) return false;

		const { dismissed, expires } = JSON.parse(storedData);
		return dismissed && Date.now() < expires;
	}

	// Initialize visibility based on localStorage if dismissible
	if (dismissible && isDismissed()) {
		visible = false;
	}

	// Define the alert styles based on the type
	const alertStyles = {
		info: 'text-blue-800 bg-blue-50 dark:bg-gray-800 dark:text-blue-400',
		success: 'text-green-800 bg-green-50 dark:bg-gray-800 dark:text-green-400',
		warning: 'text-yellow-800 bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300',
		error: 'text-red-800 bg-red-50 dark:bg-gray-800 dark:text-red-400',
		dark: 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
	};

	const iconStyles = {
		info: 'text-blue-400 dark:text-blue-500',
		success: 'text-green-400 dark:text-green-500',
		warning: 'text-yellow-300 dark:text-yellow-400',
		error: 'text-red-400 dark:text-red-500',
		dark: 'text-gray-300 dark:text-gray-400'
	};
</script>

{#if visible}
	<div class={`my-4  items-center rounded-lg p-4 ${alertStyles[type]} ${classname}`} role="alert">
		<div class="flex">
			<svg
				class={`h-4 w-4 shrink-0 ${iconStyles[type]}`}
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				fill="currentColor"
				viewBox="0 0 20 20"
			>
				<path
					d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"
				/>
			</svg>
			<span class="sr-only">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
			<div class="ms-3 text-sm font-medium">
				{message}
			</div>

			{#if dismissible}
				<button
					type="button"
					class="-mx-1.5 -my-1.5 ms-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white p-1.5 text-gray-400 hover:bg-gray-100 focus:ring-2 focus:ring-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
					aria-label="Close"
					onclick={closeAlert}
				>
					<span class="sr-only">Close</span>
					<svg
						class="h-3 w-3"
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 14 14"
					>
						<path
							stroke="currentColor"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
						/>
					</svg>
				</button>
			{/if}
		</div>
		{#if children}
			{@render children()}
		{/if}
	</div>
{/if}
