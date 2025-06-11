<script>
	import StyleSettings from '$lib/components/admin/StyleSettings.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Palette } from 'lucide-svelte';

	let overlayOpacity = 0.2;
</script>

<div class="bg-color-selector min-h-screen w-full">
	<div class="bg-overlay-selector min-h-screen w-full">
		<div class="mx-4 mb-48 flex flex-col items-center justify-center sm:mb-20">
			<section class="md:2/3 mt-8 w-full sm:w-2/3 md:w-[700px]">
				<h1
					class="mb-10 flex justify-center rounded-xl bg-slate-200 p-4 text-2xl font-bold dark:bg-slate-800 dark:text-white"
				>
					Event Styles
				</h1>
				<StyleSettings bind:overlayOpacity />
			</section>
		</div>
	</div>
</div>
