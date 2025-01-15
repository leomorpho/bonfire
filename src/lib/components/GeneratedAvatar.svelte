<script>
	import Avatar from 'svelte-boring-avatars';

	let { username, size = 60 } = $props();
</script>

<Avatar
	{size}
	name={username}
	variant="marble"
	colors={['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90']}
/>
