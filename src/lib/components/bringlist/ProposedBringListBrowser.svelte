<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { proposedBringLists, categories, type ProposedBringList } from '$lib/proposed-bring-lists';
	import ProposedBringListCard from './ProposedBringListCard.svelte';
	import { Search, Sparkles } from 'lucide-svelte';

	let { 
		isOpen = false,
		onSelect,
		onClose
	} = $props<{
		isOpen: boolean;
		onSelect: (list: ProposedBringList) => void;
		onClose: () => void;
	}>();

	let searchQuery = $state('');
	let selectedCategory = $state('All');
	
	// Filter lists based on search and category
	let filteredLists = $derived.by(() => {
		let lists = proposedBringLists;
		
		// Filter by category
		if (selectedCategory !== 'All') {
			lists = lists.filter(list => list.category === selectedCategory);
		}
		
		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			lists = lists.filter(list => 
				list.name.toLowerCase().includes(query) ||
				list.description.toLowerCase().includes(query) ||
				list.items.some(item => item.name.toLowerCase().includes(query))
			);
		}
		
		return lists;
	});

	const handleSelect = (list: ProposedBringList) => {
		onSelect(list);
		onClose();
	};

	const clearFilters = () => {
		searchQuery = '';
		selectedCategory = 'All';
	};
</script>

<Dialog.Root bind:open={isOpen}>
	<Dialog.Content class="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Sparkles class="w-5 h-5 text-blue-500" />
				Choose a Bring List Template
			</Dialog.Title>
			<Dialog.Description>
				Select from our curated bring lists to quickly set up your event essentials. 
				You can customize items after adding them.
			</Dialog.Description>
		</Dialog.Header>

		<!-- Filters -->
		<div class="flex flex-col sm:flex-row gap-4 py-4 border-b">
			<!-- Search -->
			<div class="relative flex-1">
				<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
				<Input 
					bind:value={searchQuery}
					placeholder="Search bring lists or items..."
					class="pl-10"
				/>
			</div>
			
			<!-- Category Filter -->
			<div class="flex flex-wrap gap-2">
				<Button
					variant={selectedCategory === 'All' ? 'default' : 'outline'}
					size="sm"
					onclick={() => selectedCategory = 'All'}
				>
					All ({proposedBringLists.length})
				</Button>
				{#each categories as category}
					{@const count = proposedBringLists.filter(list => list.category === category).length}
					<Button
						variant={selectedCategory === category ? 'default' : 'outline'}
						size="sm"
						onclick={() => selectedCategory = category}
					>
						{category} ({count})
					</Button>
				{/each}
			</div>
		</div>

		<!-- Results -->
		<div class="flex-1 overflow-y-auto">
			{#if filteredLists.length === 0}
				<div class="flex flex-col items-center justify-center py-12 text-center">
					<Search class="w-12 h-12 text-gray-400 mb-4" />
					<h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
						No bring lists found
					</h3>
					<p class="text-gray-600 dark:text-gray-400 mb-4">
						Try adjusting your search or category filter.
					</p>
					<Button variant="outline" onclick={clearFilters}>
						Clear Filters
					</Button>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
					{#each filteredLists as proposedList (proposedList.id)}
						<ProposedBringListCard 
							{proposedList} 
							onSelect={handleSelect}
						/>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div class="flex justify-between items-center pt-4 border-t">
			<p class="text-sm text-gray-600 dark:text-gray-400">
				{filteredLists.length} bring list{filteredLists.length !== 1 ? 's' : ''} available
			</p>
			<Button variant="outline" onclick={onClose}>
				Cancel
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>