<script lang="ts">
	import { onMount } from 'svelte';
	import { debounce } from 'lodash-es';
	import { Save } from 'lucide-svelte';
	import TextAreaAutoGrow from '$lib/components/input/TextAreaAutoGrow.svelte';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import TipTapTextEditor from '$lib/components/input/tiptap/TipTapTextEditor.svelte';
	import { eventInputTypes } from '$lib/enums';

	let {
		fieldValue = '',
		placeholder = 'Enter value...',
		fieldName,
		eventId,
		isAdmin = false,
		textClasses = 'text-3xl font-bold sm:text-4xl lg:text-5xl',
		inputType = eventInputTypes.text,
		id = null
	} = $props();

	if (!id) id = `${fieldName}-editable-field-container`;

	let isSaving: boolean = $state(false);
	let isEditing: boolean = $state(false);

	onMount(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const container = document.getElementById(id);
			if (container && !container.contains(event.target as Node)) {
				isEditing = false;
			}
		};

		document.addEventListener('click', handleClickOutside);

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	const handleEditClick = (event: MouseEvent) => {
		event.stopPropagation(); // Prevent the click event from bubbling up to the document
		if (isAdmin) {
			isEditing = true;
		}
	};

	const debouncedUpdateEvent = debounce(async () => {
		if (!eventId) return;
		await updateEvent();
	}, 800); // Debounce delay: 800ms

	const updateEventAndCloseEditability = async () => {
		await debouncedUpdateEvent();
		isEditing = false;
	};

	const updateEvent = async () => {
		const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;
		try {
			isSaving = true;
			await client.http.update('events', eventId, async (entity) => {
				entity[fieldName] = fieldValue;
			});
			console.log('🔄 Event updated successfully');
		} catch (error) {
			console.error('❌ Error updating event:', error);
		} finally {
			isSaving = false;
		}
	};
</script>

<div
	{id}
	class="relative rounded-xl bg-slate-100/70 p-3 px-5 text-center dark:bg-slate-900/70 sm:px-10"
>
	{#if isEditing}
		{#if inputType === eventInputTypes.textarea}
			<TextAreaAutoGrow
				bind:value={fieldValue}
				{placeholder}
				oninput={debouncedUpdateEvent}
				class={textClasses}
				maxLength={80}
			/>
		{:else if inputType === eventInputTypes.date}
			<input
				type="date"
				bind:value={fieldValue}
				{placeholder}
				oninput={debouncedUpdateEvent}
				class={textClasses}
			/>
		{:else if inputType == eventInputTypes.eventdetails}
			<TipTapTextEditor
				bind:content={fieldValue}
				oninput={debouncedUpdateEvent}
				class="text-left"
			/>
		{:else}
			<input
				type="text"
				bind:value={fieldValue}
				{placeholder}
				oninput={debouncedUpdateEvent}
				class={textClasses}
			/>
		{/if}
		{#if isSaving}
			<div class="absolute right-2 top-2 h-6 w-6 cursor-pointer">
				<span class="loading loading-spinner loading-xs"></span>
			</div>
		{:else}
			<button
				onclick={updateEventAndCloseEditability}
				class="absolute right-2 top-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-green-500 hover:bg-green-300 dark:bg-green-700 dark:hover:bg-green-500 transition-all duration-300"
			>
				<Save class="h-6 w-6" />
			</button>
		{/if}
	{:else}
		<button class={textClasses} onclick={handleEditClick}>
			{#if inputType == eventInputTypes.eventdetails}
				<div class="w-full dark:text-white">
					<div id="event-description-content-collapsed" transition:fade={{ duration: 100 }}>
						{#if fieldValue}
							<div id="pot-pourri">
								<!-- {@html DOMPurify.sanitize(eventDescription)} -->
								{@html fieldValue}
							</div>
						{:else}
							<div class="flex w-full justify-center py-3">
								{'No details yet...'}
							</div>
						{/if}
					</div>
				</div>
			{:else}
				{fieldValue}
			{/if}
		</button>
	{/if}
</div>
