<script>
	import Container from '$lib/components/Container.svelte';
	import { env as publicEnv } from '$env/dynamic/public';
	import Footer from '$lib/components/Footer.svelte';
</script>

<Container>
	<div id="terms-of-service" class="py-16 dark:text-white">
		<div class="mx-auto max-w-2xl px-6 lg:px-8">
			<div class="space-y-8">
				<h1 class="text-center text-4xl font-bold">Terms of Service</h1>
				<p class="text-lg text-gray-600">Effective Date: Jan 15, 2025</p>
				<div class="space-y-6">
					<h2 class="text-2xl font-semibold">1. Eligibility</h2>
					<p>
						You must be at least 13 years old to use Bonfire. By using our service, you confirm you
						meet this age requirement.
					</p>

					<h2 class="text-2xl font-semibold">2. Account Creation</h2>
					<p>
						To use Bonfire, you must create an account using a valid email address. You can choose a
						real or fictitious name and upload a profile photo.
					</p>

					<h2 class="text-2xl font-semibold">3. User Conduct</h2>
					<p>
						You agree not to engage in unlawful activities, upload harmful content, or impersonate
						others while using Bonfire.
					</p>

					<h2 class="text-2xl font-semibold">4. Account and Data Deletion</h2>
					<p>
						You may delete your account at any time through your account settings. All data
						associated with your account, including uploaded media, will be permanently removed.
					</p>

					<h2 class="text-2xl font-semibold">5. Event Data Retention</h2>
					<p>
						Events will be automatically deleted 14 days after the event has concluded. This
						includes any uploaded media and event data.
					</p>

					<h2 class="text-2xl font-semibold">6. Use of Services</h2>
					<p>
						Bonfire allows you to create and share events. Both free and paid plans are available to
						support additional features, such as creating more events.
					</p>

					<h2 class="text-2xl font-semibold">7. Intellectual Property</h2>
					<p>
						All content on Bonfire, including logos, images, and software, is owned by Bonfire or
						its licensors and is protected by copyright law.
					</p>

					<h2 class="text-2xl font-semibold">8. Limitation of Liability</h2>
					<p>
						Bonfire is provided "as is," and we make no warranties regarding the service. We are not
						liable for any damages resulting from the use of the platform.
					</p>

					<h2 class="text-2xl font-semibold">9. Modification of Terms</h2>
					<p>
						We may update these Terms of Service. Any changes will be posted here with the revised
						date.
					</p>

					<h2 class="text-2xl font-semibold">10. Governing Law</h2>
					<p>
						These Terms of Service are governed by and construed in accordance with the laws of the
						Province of British Columbia and the federal laws of Canada applicable therein, without
						regard to its conflict of law principles.
					</p>
					<h2 class="text-2xl font-semibold">11. Contact Us</h2>
					<p>If you have any questions or concerns, please contact us at:</p>
					<p>
						<strong>Email:</strong>
						<a
							href="mailto:{publicEnv.PUBLIC_FROM_EMAIL}"
							class="font-semibold text-blue-600 transition-colors duration-200 hover:text-blue-800"
						>
							{publicEnv.PUBLIC_FROM_EMAIL}
						</a>
					</p>
				</div>
			</div>
		</div>
	</div>
</Container>
<Footer />
