<script>
	import Logo from './Logo.svelte';
	import { env as publicEnv } from '$env/dynamic/public';

	const styles = `
      background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/alchemy.gif'); /* Replace
    background-repeat: repeat;
    background-size: auto;
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%;

	/* Define CSS variables for gradient height */
    --gradient-height: 30%; /* Adjust this value to control the height of the gradient */

    /* Apply a mask to fade the image */
    mask-image:
        linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) var(--gradient-height), rgba(0, 0, 0, 1) calc(100% - var(--gradient-height)), rgba(0, 0, 0, 0)),
        linear-gradient(to top, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) var(--gradient-height), rgba(0, 0, 0, 1) calc(100% - var(--gradient-height)), rgba(0, 0, 0, 0));
    mask-size: 100% 100%;
    mask-repeat: no-repeat;
    mask-position: top, bottom;
    -webkit-mask-image:
        linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) var(--gradient-height), rgba(0, 0, 0, 1) calc(100% - var(--gradient-height)), rgba(0, 0, 0, 0)),
        linear-gradient(to top, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) var(--gradient-height), rgba(0, 0, 0, 1) calc(100% - var(--gradient-height)), rgba(0, 0, 0, 0));
    -webkit-mask-size: 100% 100%;
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-position: top, bottom; 	
  `;
</script>

<div style={styles}>
	<div class="bg-slate-100/70 py-20 dark:bg-slate-900/70">
		<footer class="footer p-10 text-slate-400 sm:flex sm:justify-around">
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
	</div>
</div>
