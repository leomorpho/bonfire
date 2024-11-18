<script lang="ts">
	import { page } from '$app/stores';
	import { userIdStore } from '$lib/triplit';
    
	console.log('$page.data.user', $page.data.user);
	if ($page.data.user) {
		userIdStore.set($page.data.user.id);
	}
</script>

<slot />
