<script>
	import { Moon, Sun } from 'lucide-svelte';
	import { toggleMode } from 'mode-watcher';
	import { Button } from './ui/button';
</script>

<Button
	onclick={toggleMode}
	variant="link"
	size="icon"
	class="focus:outline-none focus-visible:ring-0"
>
	<div
		class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 p-3 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
	>
		<Sun class="!h-5 !w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
		<Moon
			class="absolute !h-5 !w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
		/>
		<span class="sr-only">Toggle theme</span>
	</div>
</Button>
