// import { openDB } from 'idb';
// import { tempAttendeeSecretParam } from './enums';

// // IndexedDB setup
// const DB_NAME = 'userDB';
// const STORE_NAME = 'users';

// const dbPromise = openDB(DB_NAME, 1, {
// 	upgrade(db) {
// 		if (!db.objectStoreNames.contains(STORE_NAME)) {
// 			db.createObjectStore(STORE_NAME, { keyPath: 'id' });
// 		}
// 	}
// });

// // Define the User type
// export type UserData = {
// 	id: string;
// 	username: string;
// 	profilePic?: Blob;
// };

// /**
//  * Fetches a user from IndexedDB by ID.
//  */
// export async function getUser(userId: string): Promise<UserData | null> {
// 	const db = await dbPromise;
// 	return (await db.get(STORE_NAME, userId)) || null;
// }

// /**
//  * Stores or updates a user in IndexedDB.
//  */
// export async function upsertUser(user: UserData): Promise<void> {
// 	const db = await dbPromise;
// 	await db.put(STORE_NAME, user);
// }

// /**
//  * Fetches multiple users from IndexedDB.
//  */
// export async function getUsers(userIds: string[]): Promise<UserData[]> {
// 	const db = await dbPromise;
// 	const users = await Promise.all(userIds.map((id) => db.get(STORE_NAME, id)));
// 	return users.filter(Boolean) as UserData[];
// }

// /**
//  * Fetches user data from the backend, downloads profile images, and caches them.
//  */
// export async function fetchAndCacheUsers(userIds: string[]): Promise<UserData[]> {
// 	try {
// 		// Fetch user metadata from the backend
// 		const queryString = `userIds=${userIds.join(',')}`;
// 		const response = await fetch(`/api/users?${queryString}`);
// 		if (!response.ok) throw new Error(`Failed to fetch users: ${response.statusText}`);

// 		const users: Record<string, { username: string; profile_pic_url: string }> =
// 			await response.json();

// 		// Fetch & cache profile images
// 		const userData: UserData[] = [];

// 		await Promise.all(
// 			Object.entries(users).map(async ([id, userData]) => {
// 				const imgResponse = await fetch(userData.profile_pic_url);
// 				const blob = await imgResponse.blob();

// 				const user: UserData = { id, username: userData.username, profilePic: blob };
// 				await upsertUser(user);
// 				userData.push(user);
// 			})
// 		);

// 		return userData;
// 	} catch (error) {
// 		console.error('Error fetching user data:', error);
// 		return [];
// 	}
// }


// const fetchProfileImageMap = async (userIds: string[], tempAttendeeSecret=null) => {
// 	// TODO: we can make this more performant by passing a last queried at timestamp (UTC) and the server will only returned changed users (added/updated/deleted images)
// 	// This function never removes any profile pic entry, only upserts them.
// 	try {
// 		// Construct the query string with comma-separated user IDs
// 		let queryString = `userIds=${userIds.join(',')}`;
// 		if (tempAttendeeSecret) {
// 			queryString = `${queryString}&${tempAttendeeSecretParam}=${tempAttendeeSecret}`;
// 		}
// 		const response = await fetch(`/profile/profile-images?${queryString}`);

// 		if (!response.ok) {
// 			throw new Error(`Failed to fetch profileImageMap: ${response.statusText}`);
// 		}

// 		// Transform the fetched data into a plain object
// 		const fetchedData: Record<
// 			string,
// 			{ filekey: string; full_image_url: string; small_image_url: string }
// 		> = await response.json();

// 		// Update the existing profileImageMap without removing old entries
// 		if (!profileImageMap) {
// 			profileImageMap = new Map(); // Initialize if not already a Map
// 		}

// 		// Create a new Map instance to trigger reactivity
// 		const updatedProfileImageMap = new Map(profileImageMap);

// 		// Update map: add new entries or update existing ones **only if the filekey changed**
// 		for (const [key, value] of Object.entries(fetchedData)) {
// 			const existingEntry = profileImageMap.get(key);

// 			if (!existingEntry || existingEntry.filekey !== value.filekey) {
// 				// ✅ Only update if the entry is new or the filekey has changed
// 				updatedProfileImageMap.set(key, value);
// 				console.log(`🔄 Updated profile image for ${key}`);
// 			} else {
// 				console.log(`✅ No change for ${key}, skipping update.`);
// 			}
// 		}

// 		profileImageMap = updatedProfileImageMap;
// 	} catch (error) {
// 		console.error('Error fetching profile image map:', error);
// 	} finally {
// 		loadingProfileImageMap = false;
// 	}
// };