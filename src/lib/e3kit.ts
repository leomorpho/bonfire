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

export const initE3Singleton = async () => {
	// Define global polyfill for `global` if not defined
	if (typeof global === 'undefined') {
		// @ts-ignore
		window.global = window;
	}

	// @ts-ignore
	window.Buffer = Buffer;

	const script = document.createElement('script');

	script.onload = async () => {
		// Make this callback async
		const EThree = window.E3kit.EThree;

		if (EThree) {
			console.log('EThree loaded:', EThree);
			console.log('#####');
			// Now you can initialize E3Kit here
			try {
				// TODO: use store instead of window to store userId
				const userId = await waitForUserId();

				console.log(`userId: ${userId}`);
				const EThree = window.E3kit.EThree;
				if (EThree) {
					try {
						const initializedEThree = await EThree.initialize(e3tokenCallback, userId);
						console.log(`Initialized e3!!!: ${initializedEThree}`);
						eThreeStore.set(initializedEThree); // Set the store value once initialized
					} catch (error) {
						console.error('Failed to initialize E3Kit:', error);
						eThreeStore.set(null); // Optionally set to null or handle error state
					}
				}
			} catch (error) {
				console.error('Failed to initialize E3Kit:', error);
			}
		} else {
			console.error('EThree is not defined.');
		}
	};

	// Error handling for script loading
	script.onerror = () => {
		console.error('Failed to load E3Kit script.');
	};

	if (isWebAssemblySupported()) {
		console.log('WebAssembly is supported');
		script.src = 'https://unpkg.com/@virgilsecurity/e3kit-browser/dist/browser.umd.js';
	} else {
		console.log('WebAssembly is NOT supported, loading asm.js fallback');
		script.src = 'https://unpkg.com/@virgilsecurity/e3kit-browser/dist/browser.asmjs.umd.js';
	}

	document.body.appendChild(script);
};

// Function to check WebAssembly support
function isWebAssemblySupported() {
	return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
}

// This tokenCallback function should fetch the JWT from your backend
const e3tokenCallback = async () => {
	// Fetch the JWT from your backend, e.g. using fetch
	const response = await fetch('/api/e3kit-jwt');
	if (!response.ok) throw new Error('Failed to fetch token');
	const data = await response.json();
	console.log(data.virgilToken);
	return data.virgilToken;
};
