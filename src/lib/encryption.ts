import { openDB } from 'idb';

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
    const baseKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

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
