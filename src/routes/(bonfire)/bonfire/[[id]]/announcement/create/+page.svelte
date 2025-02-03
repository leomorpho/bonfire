<script lang="ts">
	import { page } from '$app/stores';
	import AnnouncementForm from '$lib/components/AnnouncementForm.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
</script>

<div class="mx-4 flex flex-col items-center justify-center">
	<section class="mt-8 w-full sm:w-[450px] md:w-[550px] lg:w-[650px]">
		<Breadcrumb.Root class="bg-white dark:bg-slate-800 dark:text-white rounded-xl p-2 mt-2 bg-opacity-95">
			<Breadcrumb.List class="text-xs sm:text-sm">
				<Breadcrumb.Item>
					<Breadcrumb.Link href={`/bonfire/${$page.params.id}`}>Event</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>Create announcement</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
		<AnnouncementForm mode="create" eventId={$page.params.id} />
	</section>
</div>
