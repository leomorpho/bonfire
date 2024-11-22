<script lang="ts">
	import { page } from '$app/stores';
	import { userIdStore } from '$lib/triplit';
    
	if ($page.data.user) {
		userIdStore.set($page.data.user.id);
	}
</script>

<slot />
