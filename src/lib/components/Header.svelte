<script lang="ts">
	import NotificationsIndicator from './notifications/NotificationsIndicator.svelte';
	import Logo from './Logo.svelte';
	import type { Link } from '$lib/types';
	import Container from './Container.svelte';
	import { Menu, Cog, CircleUser, House, Shield, KeyRound, ArrowBigRight } from 'lucide-svelte';
	import { page } from '$app/stores';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ToggleTheme from './ToggleTheme.svelte';
	import { onDestroy, onMount } from 'svelte';
	import LogoutButton from './buttons/LogoutButton.svelte';

	let isAdmin = false;

	if ($page.data.user && $page.data.user.is_event_styles_admin) {
		isAdmin = true;
	}
	import { tick } from 'svelte';
	import TopBanner from './marketing/TopBanner.svelte';

	async function handleDropdownClick(href: string) {
		if (href.startsWith('/#')) {
			const id = href.substring(2);
			const element = document.getElementById(id);

			if (element) {
				await tick(); // Waits for the DOM update (dropdown closing)
				element.scrollIntoView({ behavior: 'smooth' });
			}
		}
	}

	const authLinks: Array<Link> = [
		{ icon: House, name: 'Dashboard', href: '/dashboard' },
		{ icon: CircleUser, name: 'Profile', href: '/profile' },
		{ icon: Cog, name: 'Settings', href: '/settings' },
		...(isAdmin ? [{ icon: Shield, name: 'Admin Panel', href: '/admin' }] : [])
	];

	const unauthLinks: Array<Link> = [
		// { icon: BookOpen, name: 'About', href: '/#about' },
		// { icon: DollarSign, name: 'Pricing', href: '/#pricing' },
		// { icon: CircleHelp, name: 'FAQ', href: '/#faq' }
	];

	let links = $state(unauthLinks);

	$effect(() => {
		if ($page.data.user) {
			links = authLinks;
		} else {
			links = unauthLinks;
		}
	});

	let showStickyMenu = $state(false);
	let navbarRef: HTMLElement | null = null;
	let observer: IntersectionObserver;

	onMount(() => {
		observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					showStickyMenu = !entry.isIntersecting; // Hide if navbar is visible
				});
			},
			{ root: null, threshold: 0.3 }
		);

		if (navbarRef) {
			observer.observe(navbarRef);
		}
	});

	onDestroy(() => {
		if (observer && navbarRef) {
			observer.unobserve(navbarRef);
		}
	});
</script>

{#snippet loginButton()}
	<Button
		class="m-1 bg-orange-500 p-5  text-white hover:bg-orange-400 dark:bg-orange-700 dark:text-slate-100 dark:hover:bg-orange-600"
	>
		<KeyRound class="" />Login
	</Button>
{/snippet}

{#snippet dropdown()}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			<div
				class="m-1 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
			>
				<Menu class="h-5 w-5 sm:h-5 sm:w-5" />
			</div>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="m-2 p-4 dark:bg-slate-950 z-[51]">
			<DropdownMenu.Group>
				<!-- <DropdownMenu.Label>My Account</DropdownMenu.Label> -->
				<!-- <DropdownMenu.Separator /> -->

				{#each links as link}
					<a href={link.href}>
						<DropdownMenu.Item class="cursor-pointer p-2 px-4 text-xl sm:text-lg">
							{#if link.icon}
								<link.icon class="mr-1 !h-6 !w-6 sm:!h-5 sm:!w-5" />
							{/if}
							{link.name}
						</DropdownMenu.Item>
					</a>
				{/each}
				<div class="my-5 flex w-full justify-center"><ToggleTheme /></div>

				{#if $page.data.user}
					<LogoutButton cls={'mb-3'} />
				{:else}
					<a href="/login" class="flex w-full justify-center">
						{@render loginButton()}
					</a>
				{/if}
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

<TopBanner />

<div class="w-full">
	<Container>
		<header bind:this={navbarRef} class="navbar px-0 py-0">
			<div class="navbar-start">
				<Logo />
			</div>
			<div class="navbar-center hidden lg:flex">
				<ul class="menu menu-horizontal px-1">
					{#each links as link}
						<li class="flex items-center">
							<a href={link.href}>
								{#if link.icon}
									<link.icon class="h-5 w-5" />
								{/if}
								{link.name}
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<div class="navbar-end">
				{#if $page.data.user}
					<LogoutButton cls={'hidden lg:block w-min mr-3'} />
				{:else}
					<a href="/login" class="hidden sm:flex"> {@render loginButton()}</a>
				{/if}

				<div class="hidden sm:mx-2 sm:block"><ToggleTheme /></div>
				{#if $page.data.user}
					<NotificationsIndicator />
				{/if}
				<div class="lg:hidden">
					{@render dropdown()}
				</div>
			</div>
		</header>
	</Container>
</div>

<!-- {#if showStickyMenu}
	<div class="fixed right-1 sm:right-4 top-1 sm:top-4 z-50">
		{@render dropdown()}
	</div>
{/if} -->

