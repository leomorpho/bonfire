import { openDB, type IDBPDatabase } from 'idb';
import { tempAttendeeSecretParam, tempAttendeeSecretStore } from './enums';
import { get, writable } from 'svelte/store';

// Store to track the currently needed user IDs
export const userIdsStore = writable<string[]>([]);

userIdsStore.subscribe(async (userIds) => {
	const tempAttendeeId = tempAttendeeSecretStore.get();

	if (userIds.length > 0) {
		await fetchAndCacheUsers(userIds, tempAttendeeId);
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
	isTempUser: boolean;
};

export const usersLiveDataStore = writable(new Map<string, UserData>());

/**
 * Updates the user store reactively.
 */
function updateStore(user: UserData) {
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

// /**
//  * Fetches a user from IndexedDB by ID.
//  */
// export async function getUser(userId: string): Promise<UserData | null> {
// 	const users = get(usersLiveDataStore);
// 	if (users.has(userId)) return users.get(userId) || null;

// 	const db = await getDB();
// 	const user = (await db.get(STORE_NAME, userId)) || null;
// 	if (user) updateStore(user);
// 	return user;
// }

/**
 * Stores or updates a user in IndexedDB.
 */
export async function upsertUser(user: UserData): Promise<void> {
	const db = await getDB();
	await db?.put(STORE_NAME, user);
	updateStore(user);
}

/**
 * Fetches multiple users from IndexedDB.
 */
export async function getUsers(userIds: string[]): Promise<UserData[]> {
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
	const db = await getDB();
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
	foundUsers.forEach(updateStore);
	cachedUsers.push(...foundUsers);

	return cachedUsers;
}

/**
 * Deletes a user from IndexedDB by ID.
 */
export async function deleteUser(userId: string): Promise<void> {
	const db = await getDB();
	await db?.delete(STORE_NAME, userId);
	usersLiveDataStore.update((users) => {
		const updatedUsers = new Map(users);
		updatedUsers.delete(userId);
		return updatedUsers;
	});
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
				if (needsImageUpdate && userData.small_image_url) {
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
					profilePicUpdatedAt: profileUpdatedAtDate,
					isTempUser: userData.is_temp_user
				};
				// Batch store updates
				updatedUsers.push(user);
			})
		);

		// Wait for all images to be fetched before opening a transaction
		await Promise.all(imagePromises);

		// Open a single IndexedDB transaction
		const db = await getDB();
		if (!db) throw new Error('IndexedDB is not available');
		const tx = db.transaction(STORE_NAME, 'readwrite');
		const store = tx.objectStore(STORE_NAME);

		// Store updates in one go
		updatedUsers.forEach((user) => store.put(user));

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
