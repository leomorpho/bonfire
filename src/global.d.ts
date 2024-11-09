declare global {
	interface Window {
		global: typeof globalThis;
		Buffer: typeof Buffer;
	}
}

export {};
