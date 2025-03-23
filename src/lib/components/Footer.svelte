<script>
	import Logo from './Logo.svelte';
</script>

<footer class="footer bg-white dark:bg-slate-900 p-10 text-slate-400 dark:text-slate-200">
	<aside class="w-full sm:w-64">
		<Logo styleClasses="flex h-fit items-center space-x-2" />
		<div class="mt-2 flex flex-wrap">Providing reliable social connections since 2025.</div>
	</aside>

	<nav>
		<h6 class="footer-title">LINKS</h6>
		<a class="link-hover link" href="/">Home</a>
		<a class="link-hover link" href="/#about">About</a>
	</nav>
	<nav>
		<h6 class="footer-title">Legal</h6>
		<a class="link-hover link" href="/terms-of-use">Terms of use</a>
		<a class="link-hover link" href="/privacy-policy">Privacy policy</a>
		<a class="link-hover link" href="mailto:someone@example.com">Contact</a>
	</nav>
	<!-- <div>
		<h2 class="mb-4 font-bold text-base-content text-opacity-60">SOCIALS</h2>
		<div class="text-base-content text-opacity-60">
			you can put some social icons here <br /> or a newsletter signup or whatever
		</div>
	</div> -->
</footer>
