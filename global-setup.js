import { exec } from 'child_process';
import net from 'net';

const isPortAvailable = (port, host = '127.0.0.1') => {
	return new Promise((resolve) => {
		const server = net.createServer();
		server.once('error', () => resolve(false)); // Port is in use
		server.once('listening', () => {
			server.close(() => resolve(true)); // Port is available
		});
		server.listen(port, host);
	});
};

async function globalSetup() {
	const TRIPLIT_PORT = 6543; // Replace with the port your Triplit service uses

	const portAvailable = await isPortAvailable(TRIPLIT_PORT);

	if (portAvailable) {
		console.log(`Port ${TRIPLIT_PORT} is available. Starting Triplit...`);
		const triplitProcess = exec('npm run triplit');

		triplitProcess.stdout.on('data', (data) => {
			console.log(`[Triplit] ${data}`);
		});

		triplitProcess.stderr.on('data', (data) => {
			console.error(`[Triplit Error] ${data}`);
		});

		process.on('exit', () => {
			triplitProcess.kill();
		});
	} else {
		console.log(`Port ${TRIPLIT_PORT} is in use. Assuming Triplit is already running.`);
	}
}

export default globalSetup;
