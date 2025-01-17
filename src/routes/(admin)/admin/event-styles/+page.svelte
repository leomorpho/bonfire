<script>
	import EventStyler from '$lib/components/EventStyler.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Palette } from 'lucide-svelte';
</script>

<div class="bg-color-selector min-h-screen w-full">
	<div class="bg-overlay-selector min-h-screen w-full">
		<div class="mx-4 mb-48 flex flex-col items-center justify-center sm:mb-20">
			<section class="md:2/3 mt-8 w-full sm:w-2/3 md:w-[700px]">
				<h1 class="mb-10 text-2xl font-bold bg-slate-100 p-4 rounded-xl">Event Styles</h1>
				<EventStyler />
			</section>
		</div>
	</div>
</div>
