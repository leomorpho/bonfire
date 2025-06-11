<script lang="ts">
	import { BringListCountTypes } from '$lib/enums';

	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Tally5, UserRound } from 'lucide-svelte';

	let { currentlySelectedType = $bindable(BringListCountTypes.PER_PERSON) } = $props();

	const selectByPerson = () => {
		currentlySelectedType = BringListCountTypes.PER_PERSON;
	};

	const selectByCount = () => {
		currentlySelectedType = BringListCountTypes.COUNT;
	};
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		id="item-category-btn"
		class="w-fit rounded-xl bg-slate-200 p-2 hover:bg-slate-200 dark:bg-slate-800 hover:dark:bg-slate-700"
	>
		{#if currentlySelectedType == BringListCountTypes.PER_PERSON}
			<UserRound class="h-4 w-4 sm:h-5 sm:w-5" />
		{:else if currentlySelectedType == BringListCountTypes.COUNT}
			<Tally5 class="h-4 w-4 sm:h-5 sm:w-5" />
		{/if}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="flex w-fit justify-center">
		<DropdownMenu.Group>
			<DropdownMenu.Item onclick={selectByPerson}
				><UserRound class="h-4 w-4 sm:h-5 sm:w-5" /> By Person</DropdownMenu.Item
			>
			<DropdownMenu.Item onclick={selectByCount}
				><Tally5 class="h-4 w-4 sm:h-5 sm:w-5" />Total Count</DropdownMenu.Item
			>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
