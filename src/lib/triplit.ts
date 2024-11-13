import { TriplitClient } from '@triplit/client';
import { browser } from '$app/environment';
import { env } from '$env/dynamic/private';
import {schema} from "../../triplit/schema"

export const triplitClient = new TriplitClient({
  schema,
  storage: 'indexeddb',
  serverUrl: env.PUBLIC_TRIPLIT_URL,
  token: env.PUBLIC_TRIPLIT_TOKEN,
  autoConnect: browser,
});