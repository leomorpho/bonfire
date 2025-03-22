<script lang="ts">
	import DOMPurify from 'dompurify';

	let { html } = $props();
</script>

{#if typeof window !== 'undefined' && DOMPurify}
	{@html DOMPurify.sanitize(html)}
{/if}
