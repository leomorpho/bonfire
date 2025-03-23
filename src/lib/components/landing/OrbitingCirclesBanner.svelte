<script lang="ts">
	import OrbitingCircles from './orbiting-circles/OrbitingCircles.svelte';
	import { Image } from '@unpic/svelte';

	let { rounded = true } = $props();
</script>

<div
	class={`relative flex w-full items-center justify-center md:shadow-xl ${rounded ? 'rounded-3xl' : ''}`}
>
	<!-- <BorderBeam size={150} duration={12} borderWidth={2} cls="rounded-3xl" /> -->

	<img
		class={`aspect-square w-full object-cover ${rounded ? 'rounded-3xl' : ''}`}
		srcset="
    https://f002.backblazeb2.com/file/bonfire-public/website-public/underwater-sm.jpg 1000w, 
    https://f002.backblazeb2.com/file/bonfire-public/website-public/underwater-md.jpg 2000w,
    https://f002.backblazeb2.com/file/bonfire-public/website-public/underwater-lg.jpg 3000w"
		src="https://f002.backblazeb2.com/file/bonfire-public/website-public/underwater-lg.jpg"
		alt="Underwater party!"
	/>

	<!--  Inner Circles  -->
	<OrbitingCircles
		cls="h-[30px] w-[30px] sm:h-[50px] sm:w-[50px] border-none bg-transparent text-4xl"
		duration={40}
		radius={80}
	>
		<!-- Open AI -->
		🎈
	</OrbitingCircles>
	<OrbitingCircles
		cls="h-[30px] w-[30px] sm:h-[50px] sm:w-[50px] border-none bg-transparent text-5xl"
		duration={40}
		radius={80}
		delay={-10}
	>
		🥂
	</OrbitingCircles>

	<!-- Outer Circles (reverse)  -->
	<OrbitingCircles
		cls="h-[45px] w-[45px] sm:h-[60px] sm:w-[60px] border-none bg-transparent text-6xl"
		radius={160}
		duration={30}
		reverse
	>
		<!-- Svelte -->
		🎉
	</OrbitingCircles>
	<OrbitingCircles
		cls="h-[75px] w-[75px] sm:h-[80px] sm:w-[80px] border-none bg-transparent"
		radius={160}
		duration={30}
		delay={-10}
		reverse
	>
		<Image
			class="rounded-lg"
			height={80}
			src="https://f002.backblazeb2.com/file/bonfire-public/logo/logo.png"
			layout="constrained"
			aspectRatio={1}
			alt="TODO"
		/>
	</OrbitingCircles>
</div>
