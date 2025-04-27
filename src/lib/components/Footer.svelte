<script>
	import Logo from './Logo.svelte';
	import { env as publicEnv } from '$env/dynamic/public';
</script>

<footer
	class="footer p-10 text-slate-400 sm:flex sm:justify-around"
>
	<aside class="w-full sm:w-64">
		<Logo styleClasses="flex h-fit items-center space-x-2" />
		<div class="mt-2 flex flex-wrap">Providing reliable social connections since 2025.</div>
		<p>
			If you have any feedback, please feel free to reach out to us at {publicEnv.PUBLIC_FROM_EMAIL}
		</p>
	</aside>

	<nav>
		<h6 class="footer-title">LINKS</h6>
		<a class="link link-hover" href="/">Home</a>
		<a class="link link-hover" href="/#about">About</a>
	</nav>
	<nav>
		<h6 class="footer-title">Legal</h6>
		<a class="link link-hover" href="/terms-of-use">Terms of use</a>
		<a class="link link-hover" href="/privacy-policy">Privacy policy</a>
		<a class="link link-hover" href={`mailto:${publicEnv.PUBLIC_FROM_EMAIL}`}>Contact</a>
	</nav>
	<!-- <div>
		<h2 class="mb-4 font-bold text-base-content text-opacity-60">SOCIALS</h2>
		<div class="text-base-content text-opacity-60">
			you can put some social icons here <br /> or a newsletter signup or whatever
		</div>
	</div> -->
</footer>
