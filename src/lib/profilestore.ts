import { openDB, type IDBPDatabase } from 'idb';
import { tempAttendeeSecretParam, tempAttendeeSecretStore } from './enums';
import { get, writable } from 'svelte/store';

const REFRESH_INTERVAL_MINUTES = 10; // ✅ Adjust as needed
const REFRESH_INTERVAL_MS = REFRESH_INTERVAL_MINUTES * 60 * 1000;

// Store to track the currently needed user IDs
export const userIdsStore = writable<string[]>([]);

userIdsStore.subscribe(async (userIds) => {
	const tempAttendeeId = tempAttendeeSecretStore.get();

	if (userIds.length > 0) {
		userIdsStore.set([]);
		await fetchAndCacheUsersInLiveUsersDataStore(userIds, tempAttendeeId);
	}
});

// Define the User type
export type UserData = {
	id: string;
	username: string | null;
	userUpdatedAt?: Date | null;
	smallProfilePic?: Blob | null; // Store the image blob
	fullProfilePicURL?: string | null; // Let's not store the image blob for now
	profilePicUpdatedAt?: Date | null;
	lastFetchedAt?: Date | null;
};

// Define the Temp User type
export type TempUserData = {
	id: string;
	username: string | null;
};

export const usersLiveDataStore = writable(new Map<string, UserData>());
export const tempUsersLiveDataStore = writable(new Map<string, TempUserData>());

/**
 * Updates the user store reactively.
 */
export function updateTempUsersLiveDataStoreEntry(tempUser: TempUserData) {
	tempUsersLiveDataStore.update((tempUsers) => {
		const updatedTempUsers = new Map(tempUsers);
		updatedTempUsers.set(tempUser.id, tempUser);
		return updatedTempUsers;
	});
}

/**
 * Updates the user store reactively.
 */
function updateUsersLiveDataStoreEntry(user: UserData) {
	usersLiveDataStore.update((users) => {
		const updatedUsers = new Map(users);
		updatedUsers.set(user.id, user);
		return updatedUsers;
	});
}

// IndexedDB setup
const DB_NAME = 'userDB';
const STORE_NAME = 'users';

let dbPromise: Promise<IDBPDatabase<any>> | null = null;

/**
 * Lazily initializes IndexedDB only in the browser.
 */
async function getUserDataDB() {
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

// /**
//  * Fetches a user from IndexedDB by ID.
//  */
// export async function getUser(userId: string): Promise<UserData | null> {
// 	const users = get(usersLiveDataStore);
// 	if (users.has(userId)) return users.get(userId) || null;

// 	const db = await getUserDataDB();
// 	const user = (await db.get(STORE_NAME, userId)) || null;
// 	if (user) updateUsersLiveDataStoreEntry(user);
// 	return user;
// }

/**
 * Stores or updates a user in IndexedDB.
 */
export async function upsertUserLiveDataStoreEntry(user: UserData): Promise<void> {
	const db = await getUserDataDB();
	await db?.put(STORE_NAME, user);
	updateUsersLiveDataStoreEntry(user);
}

/**
 * Fetches multiple users from IndexedDB.
 */
export async function getUsersFromLiveDataStore(userIds: string[]): Promise<UserData[]> {
	// Ensure userIds is a valid non-empty array
	if (!userIds || userIds.length === 0) {
		return [];
	}

	const users = get(usersLiveDataStore);
	const cachedUsers: UserData[] = [];
	const missingIds: string[] = [];

	for (const id of userIds) {
		if (id && users.has(id)) {
			cachedUsers.push(users.get(id)!);
		} else if (id) {
			// Ensure ID is not undefined
			missingIds.push(id);
		}
	}

	// Skip IndexedDB lookup if all users are already cached
	if (missingIds.length === 0) {
		return cachedUsers;
	}

	// Fetch missing users from IndexedDB
	const db = await getUserDataDB();
	if (!db) {
		console.error('IndexedDB is not available.');
		return cachedUsers; // Return whatever we have in cache
	}

	// Ensure we only query IndexedDB with valid IDs
	const indexedDBUsers = await Promise.all(
		missingIds.map((id) => (id ? db.get(STORE_NAME, id) : Promise.resolve(null)))
	);
	const foundUsers = indexedDBUsers.filter(Boolean) as UserData[];

	// Update store and return all users
	foundUsers.forEach(updateUsersLiveDataStoreEntry);
	cachedUsers.push(...foundUsers);

	return cachedUsers;
}

/**
 * Deletes a user from IndexedDB by ID.
 */
export async function deleteUserLiveDataStoreEntry(userId: string): Promise<void> {
	const db = await getUserDataDB();
	await db?.delete(STORE_NAME, userId);
	usersLiveDataStore.update((users) => {
		const updatedUsers = new Map(users);
		updatedUsers.delete(userId);
		return updatedUsers;
	});
}

export async function fetchAndCacheUsersInLiveUsersDataStore(
	userIds: string[],
	tempAttendeeSecret: string | null = null
): Promise<UserData[]> {
	try {
		// Get existing users from IndexedDB
		const existingUsers = new Map(
			(await getUsersFromLiveDataStore(userIds)).map((user) => [user.id, user])
		);

		// Get current timestamp
		const now = Date.now();

		// ✅ Filter out users that were fetched recently
		const usersToFetch = userIds.filter((id) => {
			const existingUser = existingUsers.get(id);
			return (
				!existingUser?.lastFetchedAt || // No fetch history
				now - existingUser.lastFetchedAt.getTime() > REFRESH_INTERVAL_MS // Last fetch was too long ago
			);
		});

		// 🛑 If no users need updating, return early
		if (usersToFetch.length === 0) {
			return Array.from(existingUsers.values());
		}

		// Construct query string
		let queryString = `userIds=${usersToFetch.join(',')}`;
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

		const imagePromises = await Promise.all(
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
				if (userData.small_image_url) {
					// if (needsImageUpdate && userData.small_image_url) {
					try {
						const imgResponse = await fetch(userData.small_image_url);
						if (imgResponse.ok) {
							smallProfilePic = await imgResponse.blob();
							// console.log(`🔄 Updated profile image for ${id}`);
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
					profilePicUpdatedAt: profileUpdatedAtDate
				};
				// Batch store updates
				updatedUsers.push(user);
			})
		);

		// Wait for all images to be fetched before opening a transaction
		await Promise.all(imagePromises);

		// Open a single IndexedDB transaction
		const db = await getUserDataDB();
		if (!db) throw new Error('IndexedDB is not available');
		const tx = db.transaction(STORE_NAME, 'readwrite');
		const store = tx.objectStore(STORE_NAME);

		// Store updates in one go
		await Promise.all(
			updatedUsers.map(async (user) => {
				await store.delete(user.id);
				await store.put(user);
			})
		);

		// Complete the transaction
		await tx.done;

		// Update the Svelte store
		usersLiveDataStore.update((users) => {
			const updatedStore = new Map(users);
			updatedUsers.forEach((user) => updatedStore.set(user.id, user));
			return updatedStore;
		});

		return updatedUsers;
	} catch (error) {
		console.error('Error fetching and caching users:', error);
		return [];
	}
}
