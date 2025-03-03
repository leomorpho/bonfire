<script>
	import { Button } from '$lib/components/ui/button';
	import { Palette } from 'lucide-svelte';
</script>

<div class="mx-4 mb-48 flex flex-col items-center justify-center sm:mb-20">
	<section class="md:2/3 mt-8 w-full sm:w-2/3 md:w-[700px]">
		<h1 class="mb-10 text-2xl font-bold">Admin Area</h1>
		<div class="space-y-2">
			<a href="admin/event-styles" class="block">
				<Button class="w-full dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">
					<Palette class="mr-1" />
					Event styles settings
				</Button>
			</a>
			<a href="admin/non-profits" class="block">
				<Button class="w-full dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">
					<Palette class="mr-1" />
					Non-Profits
				</Button>
			</a>
		</div>
	</section>
</div>
