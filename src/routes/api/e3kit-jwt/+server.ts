
import { initCrypto, VirgilCrypto, VirgilAccessTokenSigner } from 'virgil-crypto';
import { JwtGenerator } from 'virgil-sdk';
import { error, json, type Actions } from '@sveltejs/kit';
import { E3KIT_APP_ID, E3KIT_APP_KEY, E3KIT_APP_KEY_ID } from '$env/static/private';

let jwtGenerator: JwtGenerator | null = null;

// Initialize JWT generator asynchronously
async function getJwtGenerator() {
  await initCrypto();
  
  const virgilCrypto = new VirgilCrypto();
  jwtGenerator = new JwtGenerator({
    appId: E3KIT_APP_ID!,
    apiKeyId: E3KIT_APP_KEY!,
    apiKey: virgilCrypto.importPrivateKey(E3KIT_APP_KEY_ID!),
    accessTokenSigner: new VirgilAccessTokenSigner(virgilCrypto),
    millisecondsToLive: 20 * 60 * 1000 // 20 minutes
  });
}

// Ensure the generator is initialized
await getJwtGenerator();

export const actions: Actions = {
  generateToken: async ({ request, locals }) => {
    // Check if JWT generator is ready
    if (!jwtGenerator) {
      await getJwtGenerator();
    }

    // Assuming `locals.user` holds the authenticated user's identity
    const user = locals.user;
    if (!user || !user.id) {
      throw error(401, 'Unauthorized');
    }

    // Generate Virgil JWT
    const virgilJwtToken = jwtGenerator!.generateToken(user.id);
    return json({ virgilToken: virgilJwtToken.toString() });
  }
};
