<script lang="ts">
	import { Button } from '$lib/jsrepo/ui/button';
	import { UsersRound } from 'lucide-svelte';
	import SvgLoader from '../SvgLoader.svelte';

	let { isUserDataLoading = true, userPersonalData } = $props();

	const styles = `
      background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/naranjas.png');
    background-repeat: repeat;
    background-size: auto;
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%;
  `;
</script>

<div style={styles} class="rounded-xl">
	<div
		class="flex flex-col justify-center space-y-3 rounded-xl p-5 text-base bg-slate-100/80 dark:bg-slate-900/80"
	>
		<div class="flex w-full justify-center text-lg font-semibold">Bonfire Meet Questionnaire</div>
		<div class="text-center text-sm">
			Discover curated events tailored just for you! Our AI matcher connects you with like-minded
			individuals in your city. Dive into new experiences and turn strangers into lifelong friends.
		</div>
		{#if isUserDataLoading}
			<div class="flex w-full justify-center"><SvgLoader /></div>
		{:else}
			<Button
				href={userPersonalData?.meet_questionnaire ? '/meet/questionnaire' : '/meet/welcome'}
				class={`my-2 flex w-full justify-between ${userPersonalData?.meet_questionnaire ? '' : 'bg-purple-500 text-white hover:bg-purple-400'}`}
			>
				<UsersRound />
				{#if userPersonalData?.meet_questionnaire}
					Update preferences
				{:else}
					Setup
				{/if}
				<span></span>
			</Button>
		{/if}
	</div>
</div>
