<script lang="ts">
	import ProfilePicUploader from '$lib/components/ProfilePicUploader.svelte';
</script>

<div class="mx-2 flex flex-col items-center justify-center">
	<!-- History of thoughts and moods -->
	<section class="mt-8 w-full sm:w-[450px]">
		<h2 class="my-6 text-2xl font-semibold">Edit Avatar</h2>

		<div class="mb-8"><ProfilePicUploader /></div>
	</section>
</div>
