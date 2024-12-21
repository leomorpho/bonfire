<script lang="ts">
	import Logo from './Logo.svelte';
	import { PUBLIC_PROJECT_NAME } from '$env/static/public';
	import type { Link } from '$lib/types';
	import Container from './Container.svelte';
	import { LogOut, Menu, FlameKindling } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	const authLinks: Array<Link> = [
		{ name: 'Dashboard', href: '/dashboard' },
		{ name: 'Profile', href: '/profile' },
		{ name: 'Settings', href: '/settings' }
	];

	const unauthLinks: Array<Link> = [
		{ name: 'About', href: '/#about' },
		{ name: 'Pricing', href: '/#pricing' },
		{ name: 'FAQ', href: '/#faq' }
	];

	let links = unauthLinks;

	if ($page.data.user) {
		links = authLinks;
	}

	let showMenu = false;
</script>

<Container>
	<header class="navbar px-0">
		<div class="navbar-start">
			<Logo />
		</div>
		<div class="navbar-center hidden lg:flex">
			<ul class="menu menu-horizontal px-1">
				{#each links as link}
					<li>
						<a href={link.href}>{link.name}</a>
					</li>
				{/each}
			</ul>
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
				<a href="/login" class="btn ml-auto"> <FlameKindling />login</a>
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
				<a href="/login" class="btn ml-auto mr-2 hidden sm:flex"> <FlameKindling />login</a>
			{/if}
			<DropdownMenu.Root bind:open={showMenu}>
				<DropdownMenu.Trigger><Menu /></DropdownMenu.Trigger>
				<DropdownMenu.Content class="m-2">
					<DropdownMenu.Group>
						<!-- <DropdownMenu.Label>My Account</DropdownMenu.Label> -->
						<!-- <DropdownMenu.Separator /> -->

						{#each links as link}
							<a
								href={link.href}
								on:click={() => {
									showMenu = false;
								}}
							>
								<DropdownMenu.Item class="cursor-pointer p-2 px-4">{link.name}</DropdownMenu.Item>
							</a>
						{/each}

						{#if $page.data.user}
							<form
								method="post"
								class="btn mx-2 mb-2 mt-5 sm:hidden"
								action="/login?/signout"
								use:enhance
							>
								<button
									type="submit"
									on:click={() => {
										showMenu = false;
									}}
								>
									<div class="flex items-center text-red-500">
										<DropdownMenu.Item>
											<LogOut class="mr-2 h-4 w-4" />
											<span>Log out</span>
										</DropdownMenu.Item>
									</div>
								</button>
							</form>
						{:else}
							<a
								href="/login"
								on:click={() => {
									showMenu = false;
								}}
								class="btn mx-2 mb-2 mt-5 sm:hidden"
							>
								<FlameKindling />login</a
							>
						{/if}
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</header>
</Container>
