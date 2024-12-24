// @ts-expect-error just an import so ignore it
import { build, files, version } from '$service-worker';

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

const ASSETS = [
    ...build, // the app itself
    ...files  // everything in `static`
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

self.addEventListener("push", (event) => {
    try {
      console.log("[Service Worker] Push Received.");
  
      const data = event.data.json();
      const title = data.title || "Bonfire";
      // Extract the unread count from the push message data.
      const message = event.data.json();
      const unreadCount = message.unreadCount;
  
      // Set or clear the badge on the app icon.
      if (navigator.setAppBadge) {
        if (unreadCount && unreadCount > 0) {
          navigator.setAppBadge(unreadCount);
        } else {
          navigator.clearAppBadge();
        }
      }
  
      const options = {
        body: data.body,
        icon: "https://chatbond-static.s3.us-west-002.backblazeb2.com/cherie/pwa/manifest-icon-96.maskable.png",
      };
  
      // It's obligatory to show the notification to the user.
      event.waitUntil(self.registration.showNotification(title, options));
    } catch (error) {
      console.error("Error in push event:", error);
    }
  });
  
  self.addEventListener("notificationclick", function (event) {
    // Close the notification when clicked
    event.notification.close();
  
    // Retrieve dynamic URL from the notification data
    const notificationData = event.notification.data;
    const targetUrl = notificationData
      ? notificationData.url
      : "/dashboard";
  
    // This looks to see if the current is already open and focuses if it is
    event.waitUntil(
      clients
        .matchAll({
          type: "window",
        })
        .then(function (clientList) {
          for (var i = 0; i < clientList.length; i++) {
            var client = clientList[i];
            if (client.url === targetUrl && "focus" in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(targetUrl);
          }
        })
    );
  });
  