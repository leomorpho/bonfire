<script>
	import { Button } from '$lib/components/ui/button';
	import { Palette } from 'lucide-svelte';
</script>

<div class="mx-4 mb-48 flex flex-col items-center justify-center sm:mb-20">
	<section class="md:2/3 mt-8 w-full sm:w-2/3 md:w-[700px]">
		<h1 class="mb-10 text-2xl font-bold">Admin Area</h1>
		<div class="space-y-3">
			<a href="admin/event-styles">
				<Button class="w-full">
					<Palette class="mr-1" />
					Event Styles Settings
				</Button>
			</a>
		</div>
	</section>
</div>
