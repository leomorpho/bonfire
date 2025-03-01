import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { error, fail, redirect } from '@sveltejs/kit';
import { createNewUser, getUserByEmail } from '$lib/server/database/user.model.js';
import { generateId } from 'lucia';
import {
	createEmailVerificationOTP,
	deleteAllEmailOTPsForUser
} from '$lib/server/database/emailtoken.model.js';
import { loginEmailHtmlTemplate, sendEmail } from '$lib/server/email/email.js';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { lucia } from '$lib/server/auth';
import { createSigninEntry, getSignins } from '$lib/server/database/signin.model';
import { dev } from '$app/environment';
import {
	LOGIN_TYPE_ACTIVATION,
	LOGIN_TYPE_MAGIC_LINK,
	NUM_DEFAULT_LOGS_NEW_SIGNUP
} from '$lib/enums';

// Zod validation schema for login_with_email (requires email)
const loginSchema = z.object({
	email: z.string().trim().email(),
	tempAttendeeIdFormName: z.string().optional()
});

export const load = async ({ locals }) => {
	const form = await superValidate(zod(loginSchema));
	const user = locals.user;
	if (user) {
		throw redirect(301, '/dashboard');
	}

	return { form, user: locals.user };
};

export const actions = {
	login_with_email: async ({ request, getClientAddress }) => {
		const form = await superValidate(request, zod(loginSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		let user = await getUserByEmail(form.data.email);
		let login_type = LOGIN_TYPE_MAGIC_LINK;

		if (!user) {
			user = await createNewUser({
				id: generateId(15),
				email: form.data.email,
				email_verified: false,
				num_logs: NUM_DEFAULT_LOGS_NEW_SIGNUP,
				is_event_styles_admin: false
			});
			if (!user) {
				throw error(500, 'Failed to create new user');
			}
			login_type = LOGIN_TYPE_ACTIVATION;
		}

		const ip_address = getClientAddress();

		const signins = await getSignins({
			email: form.data.email,
			ip_address
		});

		// wait for 2 seconds to simulate a slow login
		if (dev) {
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}

		const ratelimit = privateEnv.SIGNIN_IP_RATELIMIT
			? parseInt(privateEnv.SIGNIN_IP_RATELIMIT)
			: 20;

		if (signins.length > ratelimit && !dev) {
			form.errors.email = [
				'Too many signins from this IP address in the last hour, please try again later'
			];
			return fail(429, { form });
		}

		await createSigninEntry({
			email: form.data.email,
			ip_address,
			logged_in_at: new Date()
		});

		await deleteAllEmailOTPsForUser(user.id);
		const verification_token = await createEmailVerificationOTP(user.id, user.email);

		await sendEmail({
			from: `${publicEnv.PUBLIC_PROJECT_NAME} <${publicEnv.PUBLIC_FROM_EMAIL}>`,
			to: user.email,
			subject: `Your ${login_type} pin for ${publicEnv.PUBLIC_PROJECT_NAME}`,
			html: loginEmailHtmlTemplate({
				login_type: login_type,
				product_url: publicEnv.PUBLIC_ORIGIN,
				product_name: publicEnv.PUBLIC_PROJECT_NAME,
				verification_token: verification_token
			}),
			headers: {
				'X-Entity-Ref-ID': generateId(20)
			}
		});

		return { form };
	},

	signout: async (e) => {
		if (!e.locals.session) {
			return fail(401);
		}
		await lucia.invalidateSession(e.locals.session.id);
		const sessionCookie = lucia.createBlankSessionCookie();
		e.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
		redirect(302, '/');
	}
};
