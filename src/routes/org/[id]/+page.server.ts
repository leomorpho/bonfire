import { error } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import { generateSignedUrl } from '$lib/server/filestorage.js';

export const load = async ({ params, locals }) => {
	const { id } = params;

	if (!id) {
		return {
			organization: null,
			futureEvents: [],
			pastEvents: [],
			userRole: null,
			isViewer: false,
			pendingJoinRequest: null,
			user: locals.user,
			bannerInfo: null
		};
	}

	const client = triplitHttpClient;

	// Fetch organization data
	let organization = null;
	try {
		organization = await client.fetchOne(
			client
				.query('organizations')
				.Where([['id', '=', id]])
				.Include('creator')
				.Include('members', (rel) => rel('members').Include('user'))
		);
	} catch (fetchError) {
		// If fetchOne throws an error when no results found, return null
		console.log('Organization fetch error:', fetchError);
		organization = null;
	}

	if (!organization) {
		return {
			organization: null,
			futureEvents: [],
			pastEvents: [],
			userRole: null,
			isViewer: false,
			pendingJoinRequest: null,
			user: locals.user,
			bannerInfo: null
		};
	}

	try {

		// Fetch banner_media separately to avoid Include permission issues
		let banner_media = null;
		try {
			banner_media = await client.fetchOne(
				client.query('banner_media').Where([['organization_id', '=', id]])
			);
		} catch (error) {
			console.log('Failed to fetch banner_media:', error);
		}

		// Manually attach banner_media to organization
		if (banner_media) {
			organization.banner_media = banner_media;
		}

		// Process banner info
		let bannerInfo = {
			bannerIsSet: false,
			bannerSmallSizeUrl: null,
			bannerLargeSizeUrl: null,
			bannerBlurHash: '',
			unsplashAuthorName: '',
			unsplashAuthorUsername: ''
		};

		if (organization.banner_media) {
			bannerInfo.bannerIsSet = true;
			const image = organization.banner_media;
			bannerInfo.bannerLargeSizeUrl = await generateSignedUrl(image.full_image_key);
			bannerInfo.bannerSmallSizeUrl = await generateSignedUrl(image.small_image_key);
			bannerInfo.unsplashAuthorName = image.unsplash_author_name ?? '';
			bannerInfo.unsplashAuthorUsername = image.unsplash_author_username ?? '';
			bannerInfo.bannerBlurHash = image.blurr_hash ?? '';
		}

		// Fetch organization events (both past and future)
		const orgEvents = await client.fetch(
			client
				.query('events')
				.Where([['organization_id', '=', id]])
				.Include('user')
				.Include('private_data')
				.Order('start_time', 'DESC')
		);

		// Separate past and future events
		const now = new Date();
		const futureEvents = orgEvents.filter((event) => new Date(event.start_time) >= now);
		const pastEvents = orgEvents.filter((event) => new Date(event.start_time) < now);

		// Check if current user is a member/viewer of this organization
		let userRole = null;
		let isViewer = false;
		let pendingJoinRequest = null;

		if (locals.user) {
			// Check membership
			const membership = await client.fetchOne(
				client.query('organization_members').Where([
					['organization_id', '=', id],
					['user_id', '=', locals.user.id]
				])
			);

			if (membership) {
				userRole = membership.role;
			} else {
				// Check if user is a viewer
				const viewership = await client.fetchOne(
					client.query('organization_viewers').Where([
						['organization_id', '=', id],
						['user_id', '=', locals.user.id]
					])
				);

				if (viewership) {
					isViewer = true;
				}

				// Check for pending join request
				pendingJoinRequest = await client.fetchOne(
					client.query('organization_join_requests').Where([
						['organization_id', '=', id],
						['user_id', '=', locals.user.id],
						['status', '=', 'pending']
					])
				);
			}
		}

		return {
			organization,
			futureEvents,
			pastEvents,
			userRole,
			isViewer,
			pendingJoinRequest,
			user: locals.user,
			bannerInfo
		};
	} catch (err) {
		console.error('Error loading organization - full error object:', err);
		console.error('Error type:', typeof err);
		console.error('Error constructor:', err?.constructor?.name);
		console.error('Error status:', err?.status);
		console.error('Error has status property:', 'status' in (err || {}));
		
		// Re-throw SvelteKit errors (like 404) without changing them
		if (err?.status) {
			console.log('Re-throwing error with status:', err.status);
			throw err;
		}
		console.error('Converting to 500 error');
		error(500, 'Failed to load organization');
	}
};
