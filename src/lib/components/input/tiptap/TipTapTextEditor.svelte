<script>
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Placeholder from '@tiptap/extension-placeholder';
	import {
		Bold,
		Code,
		Heading1,
		Heading2,
		Italic,
		List,
		ListOrdered,
		Minus,
		Quote
	} from 'lucide-svelte';
	import * as ToggleGroup from '../../ui/toggle-group';
	import OneTimeUseButton from './OneTimeUseButton.svelte';
	import DOMPurify from 'dompurify';

	let { oninput, class: className, content = $bindable() } = $props();

	let element = $state();
	let editor = $state();

	onMount(() => {
		editor = new Editor({
			element: element,
			extensions: [
				StarterKit,
				Placeholder.configure({
					// Use a placeholder:
					placeholder: 'Describe your event. Use markdown or our editor above!',
					emptyEditorClass: 'is-editor-empty',
					emptyNodeClass: 'is-empty'
				})
			],
			editorProps: {
				attributes: {
					class: `prose prose-sm sm:prose-base m-1 focus:outline-none custom-prose-line-height prose-h1:text-black dark:prose-h1:text-white prose-h2:text-black dark:prose-h2:text-white prose-p:text-black dark:prose-p:text-white prose-strong:text-black dark:prose-strong:text-white prose-blockquote:text-black`
				},
				handleKeyDown: (view, event) => {
					if (event.key === 'Enter') {
						// Reset the active states of all toggle items
						const toggleItems = document.querySelectorAll('[data-toggle-group-item]');
						toggleItems.forEach((item) => {
							item.classList.remove('active');
							item.setAttribute('aria-pressed', 'false');
							item.setAttribute('data-state', 'off');
						});

						// Reset the active states of the toggles in the editor
						editor.chain().focus().unsetBold().run();
						editor.chain().focus().unsetItalic({ active: false }).run();
					}
					return false; // Allow the event to propagate
				}
			},
			content: content,
			onUpdate: ({ editor }) => {
				// Update the content prop whenever the editor content changes
				if (editor) {
					content = DOMPurify.sanitize(editor.getHTML());
					oninput();
				}
			},
			onTransaction: () => {
				// force re-render so `editor.isActive` works as expected
				editor = editor;
			}
		});
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});
</script>

<div class="relative w-full py-4">
	{#if editor}
		<div class="fixed-menu flex w-full justify-center space-x-2">
			<ToggleGroup.Root
				type="multiple"
				class="flex flex-wrap rounded-lg bg-slate-200/80 p-1 dark:bg-slate-700/80"
			>
				<!-- <ToggleGroup.Item
					onclick={() => editor.chain().focus().toggleBold().run()}
					class={`${editor.isActive('bold') ? 'active' : ''}`}
					value="bold"
					aria-label="Toggle bold"
				>
					<Bold class="size-4" />
				</ToggleGroup.Item>
				<ToggleGroup.Item
					onclick={() => editor.chain().focus().toggleItalic().run()}
					class={`${editor.isActive('italic') ? 'active' : ''}`}
					value="italic"
					aria-label="Toggle italic"
				>
					<Italic class="size-4" />
				</ToggleGroup.Item> -->
				<ToggleGroup.Item
					onclick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
					class={`${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
					value="heading1"
					aria-label="Toggle heading 1"
				>
					<Heading1 class="size-4" />
				</ToggleGroup.Item>
				<ToggleGroup.Item
					onclick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
					class={`${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
					value="heading2"
					aria-label="Toggle heading 2"
				>
					<Heading2 class="size-4" />
				</ToggleGroup.Item>

				<OneTimeUseButton
					clickCallback={() => editor.chain().focus().toggleBulletList().run()}
					value="bulletlist"
					ariaLabel="Toggle bullet list"
					class="dark:hover:bg-zinc-800"
				>
					<List class="size-4" />
				</OneTimeUseButton>

				<OneTimeUseButton
					clickCallback={() => editor.chain().focus().toggleOrderedList().run()}
					value="orderedlist"
					ariaLabel="Toggle ordered list"
					class="dark:hover:bg-zinc-800"
				>
					<ListOrdered class="size-4" />
				</OneTimeUseButton>

				<OneTimeUseButton
					clickCallback={() => editor.chain().focus().toggleBlockquote().run()}
					value="blockquote"
					ariaLabel="Toggle blockquote"
					class="dark:hover:bg-zinc-800"
				>
					<Quote class="size-4" />
				</OneTimeUseButton>

				<OneTimeUseButton
					clickCallback={() => editor.chain().focus().toggleCodeBlock().run()}
					value="codeblock"
					ariaLabel="Toggle code block"
					class="dark:hover:bg-zinc-800"
				>
					<Code class="size-4" />
				</OneTimeUseButton>

				<OneTimeUseButton
					clickCallback={() => editor.chain().focus().setHorizontalRule().run()}
					value="horizontalrule"
					ariaLabel="Insert horizontal rule"
					class="dark:hover:bg-zinc-800"
				>
					<Minus class="size-4" />
				</OneTimeUseButton>
			</ToggleGroup.Root>
		</div>
	{/if}

	<div
		id="details-editor"
		bind:this={element}
		class={className}
	></div>
</div>
