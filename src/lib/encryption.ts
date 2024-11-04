import { openDB } from 'idb';


// // Function to get and initialize the EThree instance
// export async function initE3KitInstance(userId: string) {
// 	if (eThreeInstance != null) {
// 		return eThreeInstance;
// 	}

// 	try {
// 		// Fetch the JWT from the backend API
// 		const response = await fetch('/api/e3kit-jwt', {
// 			method: 'POST',
// 			headers: {
// 				'Content-Type': 'application/json'
// 			},
// 			body: JSON.stringify({ userId })
// 		});

// 		if (!response.ok) {
// 			throw new Error('Failed to retrieve JWT from the backend');
// 		}

// 		const data = await response.json();
// 		const virgilToken = data.virgilToken;

// 		// Initialize EThree with the token
// 		eThreeInstance = await EThree.initialize(() => Promise.resolve(virgilToken));

// 		await eThreeInstance
// 			.register()
// 			.then(() => console.log('success'))
// 			.catch((e) => console.error('error: ', e));

// 		return eThreeInstance;
// 	} catch (error) {
// 		console.error('Error initializing EThree:', error);
// 		throw error;
// 	}
// }

// Secure storage in IndexedDB
async function getDatabase() {
	return openDB('encryption-store', 1, {
		upgrade(db) {
			db.createObjectStore('secure', { keyPath: 'id' });
		}
	});
}

// Save password in secure storage
export async function savePassword(password: string) {
	const db = await getDatabase();
	await db.put('secure', { id: 'user-password', password });
}

// Key derivation
export async function deriveEncryptionKey(password: string, salt: string) {
	const encoder = new TextEncoder();
	const baseKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
		'deriveKey'
	]);

	return crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: encoder.encode(salt),
			iterations: 100000,
			hash: 'SHA-256'
		},
		baseKey,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);
}

export async function encryptData(key: CryptoKey, data: string) {
	const encoder = new TextEncoder();
	const iv = crypto.getRandomValues(new Uint8Array(12)); // Random initialization vector
	const encrypted = await crypto.subtle.encrypt(
		{
			name: 'AES-GCM',
			iv: iv
		},
		key,
		encoder.encode(data)
	);

	return {
		iv: iv,
		ciphertext: new Uint8Array(encrypted)
	};
}

export async function decryptData(key: CryptoKey, iv: BufferSource, ciphertext: BufferSource) {
	const decrypted = await crypto.subtle.decrypt(
		{
			name: 'AES-GCM',
			iv: iv
		},
		key,
		ciphertext
	);

	const decoder = new TextDecoder();
	return decoder.decode(decrypted);
}
