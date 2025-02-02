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
	import { Button } from '$lib/components/ui/button/index.js';
	import ToggleTheme from './ToggleTheme.svelte';

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
	<header class="navbar px-0">
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
				<form method="post" 
				class="ml-auto hidden sm:block mx-2" 

				action="/login?/signout" use:enhance>
					<Button
						type="submit"
						class="mx-1 flex w-full items-center bg-slate-100 text-red-500 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
					>
						<LogOut class="mr-2 h-6 w-6" />
						<span>Log out</span>
					</Button>
				</form>
			{:else}
				<a href="/login" class="btn ml-auto mr-2 hidden sm:flex"> <FlameKindling />login</a>
			{/if}

			<div class="hidden sm:mx-2 sm:block"><ToggleTheme /></div>
			{#if $page.data.user}
				<NotificationsIndicator />
			{/if}
			<div class="lg:hidden">
				<DropdownMenu.Root bind:open={showMenu}>
					<DropdownMenu.Trigger>
						<div
							class="m-1 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
						>
							<Menu class="h-6 w-6 sm:h-5 sm:w-5" />
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
							<div class="my-5 flex w-full justify-center"><ToggleTheme /></div>

							{#if $page.data.user}
								<form
									method="post"
									class="mb-3 flex w-full justify-center"
									action="/login?/signout"
									use:enhance
								>
									<Button
										type="submit"
										class="mx-2 flex w-full items-center bg-slate-100 text-red-500 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
									>
										<LogOut class="mr-2 h-6 w-6" />
										<span>Log out</span>
									</Button>
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
