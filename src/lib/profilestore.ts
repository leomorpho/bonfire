import { openDB, type IDBPDatabase } from 'idb';
import { tempAttendeeSecretParam, tempAttendeeSecretStore } from './enums';
import { writable } from 'svelte/store';

const REFRESH_INTERVAL_MINUTES = 10; // ✅ Adjust as needed
const REFRESH_INTERVAL_MS = REFRESH_INTERVAL_MINUTES * 60 * 1000;

type UserRequest = {
	userId: string;
	bypassCache: boolean;
};

// Store to track the currently needed user IDs
const userIdsStore = writable<UserRequest[]>([]);

/**
 * Adds or updates a user in the store.
 * If the user already exists, it updates the bypassCache flag.
 *
 * @param {string} userId - The user ID to add.
 * @param {boolean} bypassCache - Whether to bypass caching for this user.
 */
export function addUserRequest(userId: string, bypassCache = false) {
	userIdsStore.update((requests) => {
		const uniqueRequests = new Map(requests.map((req) => [req.userId, req.bypassCache]));

		// Update or insert the user request
		uniqueRequests.set(userId, bypassCache);

		return Array.from(uniqueRequests, ([id, cache]) => ({ userId: id, bypassCache: cache }));
	});
}

/**
 * Adds multiple users to the store.
 * Ensures unique user IDs and respects the latest bypassCache flag.
 *
 * @param {UserRequest[]} newRequests - An array of user requests.
 */
export function addUserRequests(newRequests: UserRequest[]) {
	userIdsStore.update((requests) => {
		const uniqueRequests = new Map(requests.map((req) => [req.userId, req.bypassCache]));

		// Merge new requests, overwriting existing ones if necessary
		newRequests.forEach(({ userId, bypassCache }) => {
			uniqueRequests.set(userId, bypassCache);
		});

		return Array.from(uniqueRequests, ([id, cache]) => ({ userId: id, bypassCache: cache }));
	});
}

/**
 * Removes a user from the store.
 *
 * @param {string} userId - The user ID to remove.
 */
export function removeUserRequest(userId: string) {
	userIdsStore.update((requests) => requests.filter((req) => req.userId !== userId));
}

/**
 * Checks if a user exists in the store.
 *
 * @param {string} userId - The user ID to check.
 * @returns {Promise<boolean>} - Resolves to true if the user exists, false otherwise.
 */
export async function hasUserRequest(userId: string): Promise<boolean> {
	const requests = await new Promise<UserRequest[]>((resolve) => {
		userIdsStore.subscribe(resolve)();
	});
	return requests.some((req) => req.userId === userId);
}

/**
 * Resets the store by clearing all user requests.
 */
export function resetUserRequests() {
	userIdsStore.set([]);
}

userIdsStore.subscribe(async (userRequests) => {
	const tempAttendeeId = tempAttendeeSecretStore.get();

	if (userRequests.length > 0) {
		userIdsStore.set([]);
		await fetchAndCacheUsersInLiveUsersDataStore(userRequests, tempAttendeeId);
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

export const usersLiveDataStore = writable<Record<string, UserData>>({});

export function updateUsersLiveDataStoreEntry(user: UserData) {
	usersLiveDataStore.update((users) => {
		// ✅ Only update if the user has changed
		if (!users[user.id] || JSON.stringify(users[user.id]) !== JSON.stringify(user)) {
			return { ...users, [user.id]: user }; // ✅ Only modifies one user, keeps others unchanged
		}
		return users; // ✅ No changes, prevents unnecessary updates
	});
}

/**
 * Retrieves a user by userId from usersLiveDataStore.
 *
 * @param {string} userId - The ID of the user to retrieve.
 * @returns {Promise<UserData | undefined>} - The user data if found, otherwise undefined.
 */
export async function getUserById(userId: string): Promise<UserData | undefined> {
	return new Promise((resolve) => {
		usersLiveDataStore.subscribe((users) => {
			resolve(users[userId]);
		})();
	});
}

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
 * Retrieves a temp user by tempUserId from tempUsersLiveDataStore.
 *
 * @param {string} tempUserId - The ID of the temp user to retrieve.
 * @returns {Promise<TempUserData | undefined>} - The temp user data if found, otherwise undefined.
 */
export async function getTempUserById(tempUserId: string): Promise<TempUserData | undefined> {
	return new Promise((resolve) => {
		tempUsersLiveDataStore.subscribe((tempUsers) => {
			resolve(tempUsers.get(tempUserId));
		})();
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

	// Get all users from the live data store
	const allUsers = await getAllUsersFromLiveDataStore();
	const usersMap = new Map(allUsers.map((user) => [user.id, user]));

	const cachedUsers: UserData[] = [];
	const missingIds: string[] = [];

	for (const id of userIds) {
		if (id && usersMap.has(id)) {
			cachedUsers.push(usersMap.get(id)!);
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
 * Retrieves all users currently stored in `usersLiveDataStore`.
 *
 * @returns {Promise<UserData[]>} - A list of all stored users.
 */
async function getAllUsersFromLiveDataStore(): Promise<UserData[]> {
	return new Promise<UserData[]>((resolve) => {
		usersLiveDataStore.subscribe((users) => {
			resolve(Object.values(users)); // ✅ Convert Record<string, UserData> to an array
		})();
	});
}

/**
 * Deletes a user from IndexedDB by ID.
 */
export async function deleteUserLiveDataStoreEntry(userId: string): Promise<void> {
	const db = await getUserDataDB();
	await db?.delete(STORE_NAME, userId);
	usersLiveDataStore.update((users) => {
		const updatedUsers = new Map(Object.entries(users) ?? []);
		updatedUsers.delete(userId);

		// Convert back to an object since usersLiveDataStore expects a Record
		return Object.fromEntries(updatedUsers);
	});
}

export function convertUserRequestsToMap(userRequests: UserRequest[]): Map<string, boolean> {
	return new Map(userRequests.map(({ userId, bypassCache }) => [userId, bypassCache]));
}

export async function fetchAndCacheUsersInLiveUsersDataStore(
	userRequests: UserRequest[],
	tempAttendeeSecret: string | null = null
) {
	try {
		const userIds = userRequests
			.map((req) => req.userId)
			.filter((id): id is string => typeof id === 'string'); // Ensures only strings are included

		// Get existing users from IndexedDB
		const existingUsers = new Map(
			(await getUsersFromLiveDataStore(userIds)).map((user) => [user.id, user])
		);

		const userRequestsMap = convertUserRequestsToMap(userRequests);

		// Get current timestamp
		const now = Date.now();

		// ✅ Filter out users that were fetched recently
		const usersToFetch = userIds.filter((id) => {
			const existingUser = existingUsers.get(id);
			const bypassCache = userRequestsMap.get(id) ?? false; // Default to false if not found

			// Skip filtering if bypassCache is true
			if (bypassCache) return true;

			// Only fetch if no cache exists OR if it's expired
			return (
				!existingUser?.lastFetchedAt || // No fetch history
				now - existingUser.lastFetchedAt.getTime() > REFRESH_INTERVAL_MS // Cache expired
			);
		});

		// 🛑 If no users need updating, return early
		if (usersToFetch.length === 0) {
			return;
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
					profilePicUpdatedAt: profileUpdatedAtDate,
					lastFetchedAt: new Date()
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

		usersLiveDataStore.update((users) => {
			let hasChanges = false; // Track if we need to update the store
			const updatedUsersTemp = { ...users }; // Create a shallow copy

			updatedUsers.forEach((user) => {
				const existingUser = users[user.id];

				// ✅ Check if data has actually changed
				if (!existingUser || JSON.stringify(existingUser) !== JSON.stringify(user)) {
					updatedUsersTemp[user.id] = user; // ✅ Assign user to the new object
					hasChanges = true; // ✅ Mark as modified
				}
			});

			// ✅ Only return a new object if changes were made
			return hasChanges ? updatedUsersTemp : users;
		});
	} catch (error) {
		console.error('Error fetching and caching users:', error);
	}
}
