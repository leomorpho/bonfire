<script lang="ts">
	import { page } from '$app/stores';
	import PhoneSettings from '$lib/components/settings/delivery-permissions/sms/PhoneSettings.svelte';
</script>

<PhoneSettings userId={$page.data.user.id} />

