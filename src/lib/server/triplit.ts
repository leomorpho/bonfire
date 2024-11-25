import { TriplitClient } from '@triplit/client';
import { schema } from '../../../triplit/schema';
import { PUBLIC_TRIPLIT_URL } from '$env/static/public';
import { TRIPLIT_SERVICE_TOKEN } from '$env/static/private';


export const serverTriplitClient = new TriplitClient({
	schema,
	serverUrl: PUBLIC_TRIPLIT_URL,
	token: TRIPLIT_SERVICE_TOKEN
});

