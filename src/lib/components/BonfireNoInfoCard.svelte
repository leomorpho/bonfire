<script>
	let { text, class: className = null } = $props();
</script>

<div class="flex w-full items-center justify-center">
	<div
		class={`${className} flex w-fit justify-center rounded-lg bg-slate-200 bg-opacity-70 p-2 px-5 text-center text-xs dark:bg-slate-700 dark:bg-opacity-70 dark:text-white sm:p-3 sm:text-sm`}
	>
		{text}
	</div>
</div>
