<script lang="ts">
	import { cn } from '$lib/utils';
	import BorderBeam from '../effects/border-beam/border-beam.svelte';
	import OrbitingCircles from './orbiting-circles/OrbitingCircles.svelte';
	let className: any = '';
	export { className as class };
	import { Image } from '@unpic/svelte';
</script>

<div
	class={cn(
		'relative flex w-full items-center justify-center rounded-xl md:shadow-xl',
		className
	)}
>
<BorderBeam size={150} duration={12} cls="rounded-3xl border-2"/>

	<img
		class="aspect-square w-full rounded-3xl object-cover"
		srcset="
    https://f002.backblazeb2.com/file/bonfire-public/website-public/underwater-sm.jpg 1000w, 
    https://f002.backblazeb2.com/file/bonfire-public/website-public/underwater-md.jpg 2000w,
    https://f002.backblazeb2.com/file/bonfire-public/website-public/underwater-lg.jpg 3000w"
		src="https://f002.backblazeb2.com/file/bonfire-public/website-public/underwater-lg.jpg"
		alt="Underwater party!"
	/>

	<!--  Inner Circles  -->
	<OrbitingCircles cls="h-[30px] w-[30px] sm:h-[50px] sm:w-[50px] border-none bg-transparent text-4xl" duration={20} radius={80}>
		<!-- Open AI -->
		🎈
	</OrbitingCircles>
	<OrbitingCircles
		cls="h-[30px] w-[30px] sm:h-[50px] sm:w-[50px] border-none bg-transparent text-5xl"
		duration={20}
		radius={80}
		delay={-10}
	>
	🥂
	</OrbitingCircles>

	<!-- Outer Circles (reverse)  -->
	<OrbitingCircles
		cls="h-[45px] w-[45px] sm:h-[60px] sm:w-[60px] border-none bg-transparent text-6xl"
		radius={160}
		duration={20}
		reverse
	>
		<!-- Svelte -->
		🎉
	</OrbitingCircles>
	<OrbitingCircles
		cls="h-[75px] w-[75px] sm:h-[90px] sm:w-[90px] border-none bg-transparent"
		radius={160}
		duration={20}
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
