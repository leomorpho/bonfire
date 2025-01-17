<script>
	import Container from '$lib/components/Container.svelte';
	import { PUBLIC_FROM_EMAIL } from '$env/static/public';
	import Footer from '$lib/components/Footer.svelte';
</script>

<Container>
	<!-- Warning Box -->
	<div
		class="mb-4 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-gray-800 dark:text-yellow-300"
		role="alert"
	>
		<span class="font-medium">Important Notice:</span> We do not buy, sell, or share any of the data
		you store on Bonfire. Your privacy is our priority.
	</div>
	<div id="privacy-policy" class="py-16">
		<div class="mx-auto max-w-2xl px-6 lg:px-8">
			<div class="space-y-8">
				<h1 class="text-center text-4xl font-bold">Privacy Policy</h1>
				<p class="text-lg text-gray-600">Effective Date: Jan 15, 2025</p>
				<div class="space-y-6">
					<h2 class="text-2xl font-semibold">1. Information We Collect</h2>
					<p>When you create an account, we collect the following information:</p>
					<ul class="list-disc space-y-3 pl-6">
						<li>
							<strong>Email Address:</strong> To uniquely identify your account and send notifications
							related to your events.
						</li>
						<li>
							<strong>Profile Name:</strong> You may choose a name for your profile, which can be real
							or fictitious.
						</li>
						<li>
							<strong>Profile Photo:</strong> Optional photo upload, stored for the lifetime of your
							account.
						</li>
					</ul>

					<h2 class="text-2xl font-semibold">2. Data You Upload</h2>
					<p>When you create and share events on Bonfire, you may upload:</p>
					<ul class="list-disc space-y-3 pl-6">
						<li>
							<strong>Event Data:</strong> Information like event name, description, time, and attendees.
						</li>
						<li>
							<strong>Media:</strong> Photos, videos, or other content uploaded by you or other attendees.
						</li>
					</ul>

					<h2 class="text-2xl font-semibold">3. How We Use Your Data</h2>
					<p>We use your data for the following purposes:</p>
					<ul class="list-disc space-y-3 pl-6">
						<li>Provide access to the service and manage event creation.</li>
						<li>Communicate event updates and reminders.</li>
						<li>Allow user interactions with events, including media sharing.</li>
					</ul>

					<h2 class="text-2xl font-semibold">4. Your Data Rights</h2>
					<p>
						You have the right to access, modify, or delete your account and uploaded data at any
						time via your settings.
					</p>

					<h2 class="text-2xl font-semibold">5. Event Data Retention</h2>
					<p>
						Events are stored for 14 days after completion, after which all data related to the
						event, including media, will be permanently deleted.
					</p>

					<h2 class="text-2xl font-semibold">6. Third-Party Services</h2>
					<p>
						We use third-party services for payment processing and analytics. These services have
						their own privacy policies.
					</p>

					<h2 class="text-2xl font-semibold">7. Changes to This Privacy Policy</h2>
					<p>We may update this policy. Please review it periodically for any changes.</p>

					<h2 class="text-2xl font-semibold">8. Contact Us</h2>
					<p>If you have any questions, please contact us at:</p>
					<p>
						<strong>Email:</strong>
						<a
							href="mailto:{PUBLIC_FROM_EMAIL}"
							class="font-semibold text-blue-600 transition-colors duration-200 hover:text-blue-800"
						>
							{PUBLIC_FROM_EMAIL}
						</a>
					</p>
				</div>
			</div>
		</div>
	</div>
</Container>
<Footer />
