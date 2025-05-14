<script lang="ts">
	import { page } from '$app/stores';

	let { styleClasses = '' } = $props();

	let url = $page.data.user ? '/dashboard' : '/';
</script>

<a href={url} class={`flex ${styleClasses}`}>
	<img
		src="https://f002.backblazeb2.com/file/bonfire-public/logo/Bonfire_logo_hor_color.png"
		alt="Logo"
		class="mr-3 h-6 max-w-full object-contain sm:h-8"
	/>
</a>
