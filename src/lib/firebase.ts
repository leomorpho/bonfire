import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";
import { env } from '$env/dynamic/private';

const firebaseConfig = {
    apiKey: env.FCM_API_KEY,
    authDomain: env.FCM_AUTH_DOMAIN,
    projectId: env.FCM_PROJECT_ID,
    storageBucket: env.FCM_STORAGE_BUCKET,
    messagingSenderId: env.FCM_MESSAGING_SENDER_ID,
    appId: env.FCM_APP_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

async function requestNotificationPermission() {
    const token = await getToken(messaging, { vapidKey: "YOUR_PUBLIC_VAPID_KEY" });
    console.log("FCM Token:", token);
    // Send this token to your backend for subscription
}

requestNotificationPermission();
