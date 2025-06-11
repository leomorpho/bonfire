import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { error, fail, redirect } from '@sveltejs/kit';
import { createNewUser, getUserByEmail, getUserByPhone } from '$lib/server/database/user.model.js';
import { generateId } from 'lucia';
import {
	createEmailVerificationOTP,
	deleteAllEmailOTPsForUser
} from '$lib/server/database/emailtoken.model.js';
import { loginEmailHtmlTemplate, sendEmail } from '$lib/server/email/email.js';
import { sendSmsMessage } from '$lib/sms.js';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { lucia } from '$lib/server/auth';
import { createSigninEntry, getSignins } from '$lib/server/database/signin.model';
import { dev } from '$app/environment';
import {
	LOGIN_TYPE_ACTIVATION,
	LOGIN_TYPE_MAGIC_LINK,
	NotificationType,
	NUM_DEFAULT_LOGS_NEW_SIGNUP
} from '$lib/enums';
import { convertTempToPermanentUser, triplitHttpClient } from '$lib/server/triplit.js';
import { updateRSVPForLoggedInUser } from '$lib/rsvp';

// Zod validation schema for login_with_email (requires email)
const loginSchema = z.object({
	email: z.string().trim().email(),
	tempAttendeeIdInForm: z.string().optional(),
	// RSVP data for automatic RSVP after login
	eventId: z.string().optional(),
	rsvpStatus: z.string().optional(),
	numGuests: z.coerce.number().optional()
});

// Zod validation schema for login_with_phone (requires phone)
const phoneLoginSchema = z.object({
	phone_number: z.string().min(10, 'Phone number must be at least 10 digits'),
	phone_country: z.string().optional(),
	tempAttendeeIdInForm: z.string().optional(),
	// RSVP data for automatic RSVP after login
	eventId: z.string().optional(),
	rsvpStatus: z.string().optional(),
	numGuests: z.coerce.number().optional()
});

// Common helper functions
async function findExistingTempAttendee(tempAttendeeId: string | undefined) {
	if (!tempAttendeeId) return null;
	
	return await triplitHttpClient.fetchOne(
		triplitHttpClient
			.query('temporary_attendees')
			.Where(['secret_mapping.id', '=', tempAttendeeId])
	);
}

async function createUserIfNotExists(identifier: string, isPhone: boolean, phoneCountry?: string) {
	const user = isPhone 
		? await getUserByPhone(identifier)
		: await getUserByEmail(identifier);
	
	let login_type = LOGIN_TYPE_MAGIC_LINK;
	
	if (!user) {
		const userData: any = {
			id: generateId(15),
			email_verified: false,
			num_logs: NUM_DEFAULT_LOGS_NEW_SIGNUP,
			is_event_styles_admin: false
		};
		
		if (isPhone) {
			userData.phone_number = identifier;
			userData.phone_country_code = phoneCountry || 'US';
		} else {
			userData.email = identifier;
		}
		
		const newUser = await createNewUser(userData);
		if (!newUser) {
			throw error(500, 'Failed to create new user');
		}
		login_type = LOGIN_TYPE_ACTIVATION;
		return { user: newUser, login_type };
	}
	
	return { user, login_type };
}

async function handleTempAttendeeConversion(user: any, existingTempAttendee: any) {
	if (!existingTempAttendee) return;
	
	await convertTempToPermanentUser(
		user.id,
		existingTempAttendee.event_id,
		existingTempAttendee.id,
		existingTempAttendee.name,
		existingTempAttendee.status,
		existingTempAttendee.guest_count
	);
}

async function checkRateLimit(identifier: string, ip_address: string) {
	const signins = await getSignins({
		email: identifier, // Using email field for both email and phone tracking
		ip_address
	});

	// Development delay
	if (dev) {
		await new Promise((resolve) => setTimeout(resolve, 2000));
	}

	const ratelimit = privateEnv.SIGNIN_IP_RATELIMIT
		? parseInt(privateEnv.SIGNIN_IP_RATELIMIT)
		: 20;

	return signins.length > ratelimit && !dev;
}

async function createLoginEntry(identifier: string, ip_address: string) {
	await createSigninEntry({
		email: identifier, // Using email field for both email and phone tracking
		ip_address,
		logged_in_at: new Date()
	});
}

async function storeRSVPDataInSession(cookies: any, eventId?: string, rsvpStatus?: string, numGuests?: number) {
	if (eventId && rsvpStatus) {
		const rsvpData = {
			eventId,
			rsvpStatus,
			numGuests: numGuests || 0,
			timestamp: Date.now()
		};
		cookies.set('pending_rsvp', JSON.stringify(rsvpData), {
			path: '/',
			maxAge: 60 * 30, // 30 minutes
			httpOnly: true,
			secure: !dev,
			sameSite: 'lax'
		});
	}
}

async function generateAndSendOTP(user: any, identifier: string, login_type: string, isPhone: boolean) {
	await deleteAllEmailOTPsForUser(user.id);
	const verification_token = await createEmailVerificationOTP(user.id, identifier);

	if (isPhone) {
		const smsMessage = `Your ${login_type} pin for ${publicEnv.PUBLIC_PROJECT_NAME}: ${verification_token}`;
		await sendSmsMessage(
			user.id,
			identifier,
			smsMessage,
			NotificationType.OTP_VERIFICATION
		);
	} else {
		await sendEmail(
			{
				from: `${publicEnv.PUBLIC_PROJECT_NAME} <${publicEnv.PUBLIC_FROM_EMAIL}>`,
				to: identifier,
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
			},
			NotificationType.OTP_VERIFICATION,
			user.id
		);
	}
}

export const load = async ({ locals }) => {
	const form = await superValidate(zod(loginSchema));
	const phoneForm = await superValidate(zod(phoneLoginSchema));
	const user = locals.user;
	if (user) {
		throw redirect(301, '/dashboard');
	}

	return { form, phoneForm, user: locals.user };
};

export const actions = {
	login_with_email: async ({ request, getClientAddress, cookies }) => {
		const form = await superValidate(request, zod(loginSchema));

		if (!form.valid) {
			return fail(400, { form, phoneForm: await superValidate(zod(phoneLoginSchema)) });
		}

		const identifier = form.data.email;
		const ip_address = getClientAddress();
		
		// Store RSVP data in session if provided
		await storeRSVPDataInSession(cookies, form.data.eventId, form.data.rsvpStatus, form.data.numGuests);
		
		// Check for existing temp attendee
		const existingTempAttendee = await findExistingTempAttendee(form.data.tempAttendeeIdInForm);
		
		// Create user if not exists
		const { user, login_type } = await createUserIfNotExists(identifier, false);
		
		// Handle temp attendee conversion
		await handleTempAttendeeConversion(user, existingTempAttendee);
		
		// Check rate limit
		const isRateLimited = await checkRateLimit(identifier, ip_address);
		if (isRateLimited) {
			form.errors.email = [
				'Too many signins from this IP address in the last hour, please try again later'
			];
			return fail(429, { form, phoneForm: await superValidate(zod(phoneLoginSchema)) });
		}
		
		// Create login entry
		await createLoginEntry(identifier, ip_address);
		
		// Generate and send OTP
		await generateAndSendOTP(user, identifier, login_type, false);

		return { form, phoneForm: await superValidate(zod(phoneLoginSchema)) };
	},

	login_with_phone: async ({ request, getClientAddress, cookies }) => {
		const form = await superValidate(request, zod(phoneLoginSchema));

		if (!form.valid) {
			return fail(400, { form: await superValidate(zod(loginSchema)), phoneForm: form });
		}

		const identifier = form.data.phone_number;
		const ip_address = getClientAddress();
		
		// Store RSVP data in session if provided
		await storeRSVPDataInSession(cookies, form.data.eventId, form.data.rsvpStatus, form.data.numGuests);
		
		// Check for existing temp attendee
		const existingTempAttendee = await findExistingTempAttendee(form.data.tempAttendeeIdInForm);
		
		// Create user if not exists (store phone_country for new users)
		const { user, login_type } = await createUserIfNotExists(identifier, true, form.data.phone_country);
		
		// Handle temp attendee conversion
		await handleTempAttendeeConversion(user, existingTempAttendee);
		
		// Check rate limit
		const isRateLimited = await checkRateLimit(identifier, ip_address);
		if (isRateLimited) {
			form.errors.phone_number = [
				'Too many signins from this IP address in the last hour, please try again later'
			];
			return fail(429, { form: await superValidate(zod(loginSchema)), phoneForm: form });
		}
		
		// Create login entry
		await createLoginEntry(identifier, ip_address);
		
		// Generate and send OTP
		await generateAndSendOTP(user, identifier, login_type, true);

		return { form: await superValidate(zod(loginSchema)), phoneForm: form };
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
