<script lang="ts">
	import { page } from '$app/stores';
	import BackButton from '$lib/components/BackButton.svelte';
	import LogPackage from '$lib/components/profile/LogPackage.svelte';
	import { env as publicEnv } from '$env/dynamic/public';

</script>

<div class="flex w-full justify-center">
	<div class="mx-4 mt-4 flex w-full flex-col justify-center sm:w-[450px] md:w-[550px] lg:w-[650px]">
		<div
			class="my-6 flex items-center justify-between rounded-lg bg-slate-200 p-2 text-2xl font-semibold dark:bg-slate-800 dark:text-white"
		>
			<BackButton />
			<h2>Buy more logs</h2>
			<span></span>
		</div>

		<div class="my-2 mt-5 flex justify-center">You have {$page.data.user.num_logs} logs remaining. Click below to buy more.</div>

		<LogPackage price={'1'} price_id={publicEnv.PUBLIC_1_LOG_PRICE_ID} num_logs="1" />
		<LogPackage price={'2'} price_id={publicEnv.PUBLIC_3_LOG_PRICE_ID} num_logs="3" />
		<LogPackage price={'5'} price_id={publicEnv.PUBLIC_10_LOG_PRICE_ID} num_logs="10" />
	</div>
</div>
