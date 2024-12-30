// @ts-expect-error just an import so ignore it
import { build, files, version } from '$service-worker';

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

const ASSETS = [
	...build, // the app itself
	...files // everything in `static`
];

self.addEventListener('install', (event) => {
	// Create a new cache and add all files to it
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
	// Remove previous cached data from disk
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches());
});

self.addEventListener('fetch', (event) => {
	// ignore POST requests etc
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);

		// `build`/`files` can always be served from the cache
		if (ASSETS.includes(url.pathname)) {
			return cache.match(url.pathname);
		}

		// for everything else, try the network first, but
		// fall back to the cache if we're offline
		try {
			const response = await fetch(event.request);

			if (response.status === 200) {
				cache.put(event.request, response.clone());
			}

			return response;
		} catch {
			return cache.match(event.request);
		}
	}

	event.respondWith(respond());
});

self.addEventListener('push', (event) => {
	try {
		console.log('[Service Worker] Push Received.');

		let data;
		try {
			// Try parsing as JSON
			data = event.data.json();
		} catch (err) {
			// Fallback to plain text
			data = { title: 'Notification', body: event.data.text() };
		}

		const title = data.title || 'Bonfire';
		const options = {
			body: data.body,
			icon:
				data.icon ||
				'https://chatbond-static.s3.us-west-002.backblazeb2.com/cherie/pwa/manifest-icon-96.maskable.png',
			badge: data.badge || undefined,
			data: data.url ? { url: data.url } : undefined
		};

		// Handle app badge updates (if supported)
		if (navigator.setAppBadge) {
			const unreadCount = data.unreadCount;
			if (unreadCount && unreadCount > 0) {
				navigator.setAppBadge(unreadCount);
			} else {
				navigator.clearAppBadge();
			}
		}

		// Show the notification
		event.waitUntil(self.registration.showNotification(title, options));
	} catch (error) {
		console.error('Error in push event:', error);
	}
});

self.addEventListener('notificationclick', function (event) {
  console.log("Notification clicked:", event.notification);
  
	// Close the notification when clicked
	event.notification.close();

	// Retrieve dynamic URL from the notification data
	const notificationData = event.notification.data;
	const targetUrl = notificationData ? notificationData.url : '/dashboard';

	// This looks to see if the current is already open and focuses if it is
	event.waitUntil(
		clients
			.matchAll({
				type: 'window'
			})
			.then(function (clientList) {
				for (var i = 0; i < clientList.length; i++) {
					var client = clientList[i];
					if (client.url === targetUrl && 'focus' in client) {
						return client.focus();
					}
				}
				if (clients.openWindow) {
					return clients.openWindow(targetUrl);
				}
			})
	);
});
