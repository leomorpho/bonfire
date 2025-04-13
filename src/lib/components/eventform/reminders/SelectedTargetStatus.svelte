<script lang="ts">
	let { status, onClick, isSelected = false } = $props();
</script>

<button
	onclick={onClick}
	class={`m-2 cursor-pointer rounded-xl p-1 px-2 transition-all
    ${isSelected ? 'bg-green-500 hover:bg-orange-500 dark:bg-green-600 dark:hover:bg-orange-600' : 'bg-slate-100 hover:bg-green-200 dark:bg-slate-700 dark:hover:bg-green-800'}`}
>
	{status}
</button>
