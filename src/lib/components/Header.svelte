<script lang="ts">
	import NotificationsIndicator from './notifications/NotificationsIndicator.svelte';
	import Logo from './Logo.svelte';
	import type { Link } from '$lib/types';
	import Container from './Container.svelte';
	import {
		LogOut,
		Menu,
		FlameKindling,
		BookOpen,
		DollarSign,
		CircleHelp,
		Cog,
		CircleUser,
		House,
		Shield
	} from 'lucide-svelte';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	let isAdmin = false;

	if ($page.data.user && $page.data.user.is_event_styles_admin) {
		isAdmin = true;
	}

	const authLinks: Array<Link> = [
		{ icon: House, name: 'Dashboard', href: '/dashboard' },
		{ icon: CircleUser, name: 'Profile', href: '/profile' },
		{ icon: Cog, name: 'Settings', href: '/settings' },
		...(isAdmin ? [{ icon: Shield, name: 'Admin Panel', href: '/admin' }] : [])
	];

	const unauthLinks: Array<Link> = [
		{ icon: BookOpen, name: 'About', href: '/#about' },
		{ icon: DollarSign, name: 'Pricing', href: '/#pricing' },
		{ icon: CircleHelp, name: 'FAQ', href: '/#faq' }
	];

	let links = $state(unauthLinks);

	$effect(() => {
		if ($page.data.user) {
			links = authLinks;
		} else {
			links = unauthLinks;
		}
	});

	let showMenu = $state(false);

	function toggleMenu(e: Event) {
		e.stopPropagation();
		showMenu = !showMenu;
	}
</script>

<Container>
	<header class="navbar px-0" id="top-header">
		<div class="navbar-start">
			<Logo />
		</div>
		<div class="navbar-center hidden lg:flex">
			<ul class="menu menu-horizontal px-1">
				{#each links as link}
					<li class="flex items-center">
						<a href={link.href}>
							{#if link.icon}
								<link.icon class="h-6 w-6" />
							{/if}
							{link.name}
						</a>
					</li>
				{/each}
			</ul>
		</div>

		<div class="navbar-end">
			{#if $page.data.user}
				<form method="post" class="ml-auto hidden sm:block" action="/login?/signout" use:enhance>
					<button type="submit" class="btn mr-2">
						<div class="flex items-center text-red-500">
							<LogOut class="mr-2 h-6 w-6" />
							<span>Log out</span>
						</div>
					</button>
				</form>
			{:else}
				<a href="/login" class="btn ml-auto mr-2 hidden sm:flex"> <FlameKindling />login</a>
			{/if}
			{#if $page.data.user}
				<NotificationsIndicator />
			{/if}
			<div class="lg:hidden">
				<DropdownMenu.Root bind:open={showMenu}>
					<DropdownMenu.Trigger>
						<div
							class="m-1 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 sm:h-10 sm:w-10"
						>
							<Menu class="h-6 w-6 text-gray-600 sm:h-5 sm:w-5" />
						</div>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="m-2">
						<DropdownMenu.Group>
							<!-- <DropdownMenu.Label>My Account</DropdownMenu.Label> -->
							<!-- <DropdownMenu.Separator /> -->

							{#each links as link}
								<a href={link.href}>
									<DropdownMenu.Item class="cursor-pointer p-2 px-4">
										{#if link.icon}
											<link.icon class="mr-1 h-6 w-6" />
										{/if}
										{link.name}
									</DropdownMenu.Item>
								</a>
							{/each}

							{#if $page.data.user}
								<form
									method="post"
									class="btn mx-2 mb-2 mt-5 sm:hidden"
									action="/login?/signout"
									use:enhance
								>
									<button type="submit" class="btn mr-2">
										<div class="flex items-center text-red-500">
											<LogOut class="mr-2 h-6 w-6" />
											<span>Log out</span>
										</div>
									</button>
								</form>
							{:else}
								<a href="/login" onclick={toggleMenu} class="btn mx-2 mb-2 mt-5 sm:hidden">
									<FlameKindling />login</a
								>
							{/if}
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</div>
	</header>
</Container>

<style>
	:root {
		--safe-area-top: env(safe-area-inset-top, 0px);
	}

	#top-header {
		position: fixed;
		top: var(--safe-area-top, 0);
		left: 0;
		width: 100%;
		z-index: 1000; /* Keep it above other elements */
		background: rgba(255, 255, 255, 0.95); /* Slight transparency */
		padding-top: var(--safe-area-top, 10px); /* Ensure padding below the status bar */
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	@supports (padding-top: env(safe-area-inset-top)) {
		#top-header {
			padding-top: env(safe-area-inset-top);
		}
	}
</style>
