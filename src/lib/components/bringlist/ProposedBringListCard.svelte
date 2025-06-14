<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import type { ProposedBringList } from '$lib/proposed-bring-lists';
	import { Check } from 'lucide-svelte';

	let { 
		proposedList, 
		onSelect,
		class: className = '' 
	} = $props<{
		proposedList: ProposedBringList;
		onSelect: (list: ProposedBringList) => void;
		class?: string;
	}>();

	const handleSelect = () => {
		onSelect(proposedList);
	};
</script>

<Card class={`cursor-pointer transition-all hover:shadow-md hover:border-blue-300 ${className}`}>
	<CardHeader class="pb-3">
		<div class="flex items-start justify-between">
			<div class="flex items-center gap-2">
				<span class="text-2xl">{proposedList.emoji}</span>
				<div>
					<CardTitle class="text-lg">{proposedList.name}</CardTitle>
					<Badge variant="secondary" class="mt-1">{proposedList.category}</Badge>
				</div>
			</div>
		</div>
		<CardDescription class="text-sm text-gray-600 dark:text-gray-400">
			{proposedList.description}
		</CardDescription>
	</CardHeader>
	
	<CardContent class="pt-0">
		<div class="space-y-2">
			<div class="text-sm font-medium text-gray-700 dark:text-gray-300">
				{proposedList.items.length} items included:
			</div>
			<div class="flex flex-wrap gap-1">
				{#each proposedList.items.slice(0, 6) as item}
					<span class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
						{item.name}
					</span>
				{/each}
				{#if proposedList.items.length > 6}
					<span class="text-xs text-gray-500 px-2 py-1">
						+{proposedList.items.length - 6} more
					</span>
				{/if}
			</div>
		</div>
		
		<Button 
			onclick={handleSelect} 
			class="w-full mt-4"
			variant="outline"
		>
			<Check class="w-4 h-4 mr-2" />
			Use This List
		</Button>
	</CardContent>
</Card>