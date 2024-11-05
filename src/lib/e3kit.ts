import { writable, get } from 'svelte/store';

// Store for eThree, initially set to null.
const eThreeStore = writable(null);

export const initializeEThree = async (tokenCallback: any, userId: any) => {
	const EThree = window.E3kit.EThree;
	if (EThree) {
		try {
			const initializedEThree = await EThree.initialize(tokenCallback, userId);
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

export default eThreeStore;
