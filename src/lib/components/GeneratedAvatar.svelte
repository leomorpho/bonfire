<script>
	import Avatar from 'svelte-boring-avatars';

	let { username, size = 60 } = $props();
</script>

<Avatar
	{size}
	name={username}
	variant="marble"
	colors={['#A9C1FFFF', '#418491FF', '#F0AB3D', '#F07171FF', '#C20D90']}
/>
