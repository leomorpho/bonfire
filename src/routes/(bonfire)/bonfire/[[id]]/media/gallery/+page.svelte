<script lang="ts">
	import { page } from '$app/stores';
	import { Image } from '@unpic/svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
</script>

<div class="mx-4 flex flex-col items-center justify-center">
	<section class="mt-8 w-full sm:w-[450px] md:w-[550px] lg:w-[650px]">
		<Breadcrumb.Root class="mb-10">
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href={`/bonfire/${$page.params.id}`}>Event</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>Gallery</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
		{#if $page.data.eventFiles}
			<div class=" my-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
				{#each $page.data.eventFiles as file}
					<Image
						height={400}
						class="rounded-lg"
						src={file.URL}
						layout="constrained"
						aspectRatio={4 / 3}
						alt={file.file_name}
					/>
				{/each}
			</div>
		{/if}
	</section>
</div>
