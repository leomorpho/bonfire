<script>
	let { children } = $props();
</script>

<div
	class="shadow flex flex-col items-center justify-center rounded-3xl bg-slate-200 p-3 transition-colors
	duration-300 ease-in-out hover:bg-slate-200 dark:bg-black dark:hover:bg-slate-800"
>
	{@render children()}
</div>
