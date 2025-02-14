import { openDB, type IDBPDatabase } from 'idb';
import { tempAttendeeSecretParam } from './enums';

// IndexedDB setup
const DB_NAME = 'userDB';
const STORE_NAME = 'users';

let dbPromise: Promise<IDBPDatabase<any>> | null = null;

/**
 * Lazily initializes IndexedDB only in the browser.
 */
async function getDB() {
	if (typeof indexedDB === 'undefined') {
		console.warn('IndexedDB is not available in this environment.');
		return null;
	}

	if (!dbPromise) {
		dbPromise = openDB(DB_NAME, 1, {
			upgrade(db) {
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					db.createObjectStore(STORE_NAME, { keyPath: 'id' });
				}
			}
		});
	}

	return dbPromise;
}

// Define the User type
export type UserData = {
	id: string;
	username: string | null;
	userUpdatedAt?: Date | null;
	smallProfilePic?: Blob | null; // Store the image blob
	fullProfilePicURL?: string | null; // Let's not store the image blob for now
	profilePicUpdatedAt?: Date | null;
	isTempUser: boolean;
};

/**
 * Fetches a user from IndexedDB by ID.
 */
export async function getUser(userId: string): Promise<UserData | null> {
	const db = await getDB();
	return (await db.get(STORE_NAME, userId)) || null;
}

/**
 * Stores or updates a user in IndexedDB.
 */
export async function upsertUser(user: UserData): Promise<void> {
	const db = await getDB();
	await db.put(STORE_NAME, user);
}

/**
 * Fetches multiple users from IndexedDB.
 */
export async function getUsers(userIds: string[]): Promise<UserData[]> {
	const db = await getDB();
	const users = await Promise.all(userIds.map((id) => db.get(STORE_NAME, id)));
	return users.filter(Boolean) as UserData[];
}

export async function fetchAndCacheUsers(
	userIds: string[],
	tempAttendeeSecret: string | null = null
): Promise<UserData[]> {
	try {
		// Get existing users from IndexedDB
		const existingUsers = new Map((await getUsers(userIds)).map((user) => [user.id, user]));

		// Construct query string
		let queryString = `userIds=${userIds.join(',')}`;
		if (tempAttendeeSecret) {
			queryString += `&${tempAttendeeSecretParam}=${tempAttendeeSecret}`;
		}

		const response = await fetch(`/profile/profile-images?${queryString}`);
		if (!response.ok) throw new Error(`Failed to fetch profile images: ${response.statusText}`);

		// Fetch user data
		const usersData: Record<
			string,
			{
				username: string;
				user_updated_at: string;
				filekey: string;
				full_image_url: string;
				small_image_url: string;
				profile_image_updated_at: string;
				is_temp_user: boolean;
			}
		> = await response.json();

		const updatedUsers: UserData[] = [];

		await Promise.all(
			Object.entries(usersData).map(async ([id, userData]) => {
				const existingUser = existingUsers.get(id);

				// Check if we need to update
				const needsUsernameUpdate = !existingUser || existingUser.username !== userData.username;

				const remoteProfilePicUpdatedAt = new Date(userData.profile_image_updated_at);
				const needsImageUpdate =
					!existingUser || existingUser.profilePicUpdatedAt !== remoteProfilePicUpdatedAt;

				// If no update is needed, skip
				if (!needsUsernameUpdate && !needsImageUpdate) {
					// console.log(`✅ No change for ${id}, skipping update.`);
					updatedUsers.push(existingUser);
					return;
				}

				let smallProfilePic = existingUser?.smallProfilePic; // Keep old pic if no update needed

				// Fetch new image if profile image is updated
				if (needsImageUpdate && userData.small_image_url) {
					try {
						const imgResponse = await fetch(userData.small_image_url);
						if (imgResponse.ok) {
							smallProfilePic = await imgResponse.blob();
							console.log(`🔄 Updated profile image for ${id}`);
						} else {
							console.warn(`⚠️ Failed to fetch profile image for ${id}: ${imgResponse.statusText}`);
						}
					} catch (e) {
						console.error(`❌ Error fetching profile image for ${id}:`, e);
					}
				}

				const userUpdatedAtDate = userData.user_updated_at
					? new Date(userData.user_updated_at)
					: null;
				const profileUpdatedAtDate = userData.profile_image_updated_at
					? new Date(userData.profile_image_updated_at)
					: null;

				// Store in IndexedDB
				const user: UserData = {
					id,
					username: userData.username,
					userUpdatedAt: userUpdatedAtDate,
					smallProfilePic,
					fullProfilePicURL: userData.full_image_url,
					profilePicUpdatedAt: profileUpdatedAtDate,
					isTempUser: userData.is_temp_user
				};
				console.log('===?> user', user);
				await upsertUser(user);
				updatedUsers.push(user);
			})
		);
		return updatedUsers;
	} catch (error) {
		console.error('Error fetching and caching users:', error);
		return [];
	}
}
