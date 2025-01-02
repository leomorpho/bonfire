import { fetchAccessibleEventFiles } from '$lib/filestorage';
import { json } from '@sveltejs/kit';

export const GET = async ({ params, locals }) => {
	const bonfireId = params.id;
	const user = locals.user;

	try {
		const { files, isOwner } = await fetchAccessibleEventFiles(bonfireId as string, user);
		return json({ files, isOwner });
	} catch (err) {
		return json({ error: err.message }, { status: 400 });
	}
};
