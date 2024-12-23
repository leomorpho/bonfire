import { error, json } from '@sveltejs/kit';
import webPush from 'web-push';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { VAPID_PUBLIC_KEY, DEV_VAPID_PUBLIC_KEY } from '$env/static/public';

if (
	(dev && (!DEV_VAPID_PUBLIC_KEY || !env.DEV_VAPID_PRIVATE_KEY)) ||
	(!dev && (!VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY))
) {
	throw error;
}

const publicKey = dev ? DEV_VAPID_PUBLIC_KEY : VAPID_PUBLIC_KEY;
const privateKey = dev ? env.DEV_VAPID_PRIVATE_KEY : env.VAPID_PRIVATE_KEY;

webPush.setVapidDetails(`mailto:${env.FROM_EMAIL}`, publicKey as string, privateKey as string);

const subscriptions = []; // Replace with a database in production

export async function POST({ request }) {
	const subscription = await request.json();
	subscriptions.push(subscription); // Save to database
	return json({ success: true });
}
