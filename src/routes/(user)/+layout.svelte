<script lang="ts">
	import { page } from '$app/stores';
	import { userIdStore } from '$lib/triplit';

	userIdStore.set($page.data.user.id);
</script>

<slot />
