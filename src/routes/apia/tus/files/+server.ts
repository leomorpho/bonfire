import { Server } from '@tus/server';
import { FileStore } from '@tus/file-store';
import { Readable } from 'stream';
import { ServerResponse, type IncomingMessage } from 'http';

// 🚀 Setup TUS server
const tusServer = new Server({
    path: '/api/tus/files',
    datastore: new FileStore({ directory: './uploads' }),
    respectForwardedHeaders: true,
    maxSize: 500 * 1024 * 1024, // 500MB limit
});

// 🚨 Prevent SvelteKit from parsing the request
export const config = {
    body: { parse: false }
};

// ✅ Convert SvelteKit Request to a Node.js IncomingMessage
async function toNodeRequest(request: Request): Promise<IncomingMessage> {
    const rawBody = await request.arrayBuffer(); // Get raw binary body
    const readableBody = new Readable(); // Create a Readable stream
    readableBody.push(Buffer.from(rawBody)); // Push data into the stream
    readableBody.push(null); // End the stream

    return Object.assign(readableBody, {
        method: request.method,
        url: new URL(request.url).pathname,
        headers: Object.fromEntries(request.headers),
        connection: { remoteAddress: '127.0.0.1' }
    }) as IncomingMessage;
}

// ✅ Handle all TUS requests (POST, PATCH, HEAD, DELETE)
export async function POST({ request }) {
    const req = await toNodeRequest(request);
    const res = new ServerResponse(req);

    return new Promise<Response>((resolve) => {
        res.on('finish', () => {
            resolve(new Response(null, { status: res.statusCode }));
        });

        tusServer.handle(req, res);
    });
}

// ✅ Export for other TUS methods
export { POST as PATCH, POST as HEAD, POST as DELETE, POST as OPTIONS };
