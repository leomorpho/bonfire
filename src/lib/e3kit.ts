import { writable, get } from 'svelte/store';

// Store for eThree, initially set to null.
const eThreeStore = writable(null);
export const userIdStore = writable(null);

export const initializeEThree = async (tokenCallback: any, userId: any) => {
	const EThree = window.E3kit.EThree;
	if (EThree) {
		try {
			const initializedEThree = await EThree.initialize(tokenCallback, userId);
			console.log(`Initialized e3: ${initializedEThree}`);
			eThreeStore.set(initializedEThree); // Set the store value once initialized
		} catch (error) {
			console.error('Failed to initialize E3Kit:', error);
			eThreeStore.set(null); // Optionally set to null or handle error state
		}
	}
};

export async function waitForEThree() {
	return new Promise((resolve) => {
		const checkEThree = () => {
			const value = get(eThreeStore);
			if (value) {
				resolve(value);
			} else {
				setTimeout(checkEThree, 100); // Check again after a short delay
			}
		};
		checkEThree();
	});
}


export async function waitForUserId() {
	return new Promise((resolve) => {
		const checkUserId = () => {
			const value = get(userIdStore);
			if (value) {
				resolve(value);
			} else {
				setTimeout(checkUserId, 100); // Check again after a short delay
			}
		};
		checkUserId();
	});
}