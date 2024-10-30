<script lang="ts">
	import { PUBLIC_PROJECT_NAME } from '$env/static/public';
	import type { Link } from '$lib/types';
	import Container from './Container.svelte';
	import { LogOut, Menu, Rainbow } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';

	const links: Array<Link> = [
		{ name: 'About', href: '/#about' },
		{ name: 'Pricing', href: '/#pricing' },
		{ name: 'FAQ', href: '/#faq' }
	];
</script>

<Container>
	<header class="navbar px-0">
		<div class="navbar-start">
			<a href="/" class="flex">
				<Rainbow class="mr-3 h-10 w-10"/>
				<div class="text-2xl font-bold sm:text-3xl">{PUBLIC_PROJECT_NAME}</div>
			</a>
		</div>
		<div class="navbar-center hidden lg:flex">
			{#if !$page.data.user}
				<ul class="menu menu-horizontal px-1">
					{#each links as link}
						<li>
							<a href={link.href}>{link.name}</a>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
		<div class="navbar-end hidden lg:flex">
			{#if $page.data.user}
				<form method="post" class="ml-auto" action="/login?/signout" use:enhance>
					<button type="submit" class="btn">
						<div class="flex items-center text-red-500">
							<LogOut class="mr-2 h-4 w-4" />
							<span>Log out</span>
						</div>
					</button>
				</form>
			{:else}
				<a href="/login" class="btn ml-auto"> <Rainbow />login</a>
			{/if}
		</div>
		<div class="navbar-end lg:hidden">
			{#if $page.data.user}
				<form method="post" class="ml-auto hidden sm:block" action="/login?/signout" use:enhance>
					<button type="submit" class="btn mr-2">
						<div class="flex items-center text-red-500">
							<LogOut class="mr-2 h-4 w-4" />
							<span>Log out</span>
						</div>
					</button>
				</form>
			{:else}
				<a href="/login" class="btn ml-auto mr-2 hidden sm:flex"> <Rainbow />login</a>
			{/if}
			<!-- <a href="/" class="btn ml-auto">your call to action</a> -->
			<div class="dropdown dropdown-end">
				<div tabindex="0" role="button" class="btn btn-ghost m-1"><Menu /></div>
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<ul
					tabindex="0"
					class="menu dropdown-content z-[1] w-52 rounded-box bg-base-100 p-2 shadow"
				>
					{#each links as link}
						<li>
							<a href={link.href}>{link.name}</a>
						</li>
					{/each}
					{#if $page.data.user}
						<form
							method="post"
							class="btn mx-2 mb-2 mt-5 sm:hidden"
							action="/login?/signout"
							use:enhance
						>
							<button type="submit">
								<div class="flex items-center text-red-500">
									<LogOut class="mr-2 h-4 w-4" />
									<span>Log out</span>
								</div>
							</button>
						</form>
					{:else}
						<a href="/login" class="btn mx-2 mb-2 mt-5 sm:hidden"> <Rainbow />login</a>
					{/if}
				</ul>
			</div>
		</div>
	</header>
</Container>
