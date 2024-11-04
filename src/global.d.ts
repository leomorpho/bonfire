declare global {
    interface Window {
      global: typeof globalThis;
      Buffer: typeof Buffer;
      E3kit?: any; // Adjust the type based on the actual E3kit type if available
      userId?: string;
    }
  }
  
  export {};