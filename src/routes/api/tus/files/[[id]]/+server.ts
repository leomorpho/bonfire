import { Server } from '@tus/server';
import { FileStore } from '@tus/file-store';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Readable } from 'stream';

/**
 * Setup the TUS server
 */
const tusServer = new Server({
	path: '/api/tus/files/',
	datastore: new FileStore({ directory: './uploads' }),
	maxSize: 500 * 1024 * 1024 // Set max size to 500MB
});

/**
 * Convert SvelteKit request to a Node.js-style request
 */
async function handleTusRequest(event): Promise<Response> {
    return new Promise(async (resolve, reject) => {
        const { request, url } = event;

        try {
            let fixedPathname = url.pathname.replace(/\/+/g, '/'); // ✅ Remove double slashes

            console.log('🔹 Backend - Original Pathname:', url.pathname);
            console.log('✅ Backend - Fixed Pathname:', fixedPathname);

            // Convert request body to Readable stream
            const rawBody = await request.arrayBuffer();
            const bodyStream = Readable.from(Buffer.from(rawBody));

            // Create Node.js-style request object
            const rawReq = Object.assign(bodyStream, {
                method: request.method,
                url: fixedPathname, // ✅ Ensure cleaned URL is used
                headers: Object.fromEntries(request.headers),
                socket: {},
                on: () => {},
                destroy: () => {}
            });

            // Node.js-style response object
            const rawRes = {
                statusCode: 200,
                headers: {},
                writeHead(status, headers) {
                    this.statusCode = status;
                    this.headers = headers;
                },
                setHeader(key, value) {
                    this.headers[key] = value;
                },
                end(body) {
                    resolve(new Response(body, { status: this.statusCode, headers: this.headers }));
                },
                write(chunk) {
                    if (!this.body) this.body = '';
                    this.body += chunk;
                },
                on(event, callback) {
                    if (event === 'finish') {
                        callback();
                    }
                }
            };

            // ✅ Log the final request passed to TUS
            console.log('✅ Backend - Forwarding Fixed Path:', rawReq.url);

            // Let the TUS server handle the request
            tusServer.handle(rawReq as any, rawRes as any);
        } catch (err) {
            console.error(`❌ Error handling TUS request: ${err.message}`);
            reject(error(500, 'Internal Server Error'));
        }
    });
}


/**
 * Handle all TUS-related requests dynamically
 */
export const POST: RequestHandler = async (event) => handleTusRequest(event);
export const PATCH: RequestHandler = async (event) => handleTusRequest(event);
export const HEAD: RequestHandler = async (event) => handleTusRequest(event);
export const OPTIONS: RequestHandler = async (event) => handleTusRequest(event);
export const PUT: RequestHandler = async (event) => handleTusRequest(event);
export const GET: RequestHandler = async (event) => handleTusRequest(event);
