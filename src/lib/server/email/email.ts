/* eslint-disable no-irregular-whitespace */
import { SMTPClient } from 'emailjs';
import { dev } from '$app/environment';
import { inline } from '@css-inline/css-inline';
import layout from './layout.html?raw';
import login from './login-email.html?raw';
import notificationEmail from './notification-email.html?raw';
// import postmark from 'postmark';
import { Resend } from 'resend';
import { env as privateEnv } from '$env/dynamic/private';
import { triplitHttpClient } from '../triplit';
import { notificationTypeToSubject, type NotificationType } from '$lib/enums';
import { generateId } from 'lucia/dist/crypto';
import { and } from '@triplit/client';
import { env as publicEnv } from '$env/dynamic/public';

const localClient = new SMTPClient({
	host: 'localhost',
	port: 1025,
	ssl: false
});

type LayoutEmailVariables = {
	product_url: string;
	product_name: string;
};

type LoginEmailVariables = LayoutEmailVariables & {
	login_type: string;
	verification_token: string;
};

// NOTE: I included this initial authentication email template so that you can get started right away.
// It was created with the Postmark template editor. It is better to create your emails there and than send emails with
// postmarkClient.sendEmailWithTemlate()

export const loginEmailHtmlTemplate = (variables: LoginEmailVariables) => {
	return inline(
		layout
			.replaceAll('{{{ @content }}}', login)
			.replaceAll('{{ login_type }}', variables.login_type)
			.replaceAll('{{ product_url }}', variables.product_url)
			.replaceAll('{{ product_name }}', variables.product_name)
			.replaceAll('{{ verification_token }}', variables.verification_token)
	);
};

type NotificationEmailVariables = LayoutEmailVariables & {
	message: string;
	subject: string;
	actionButtonName: string;
	actionButtonUrl: string;
	unsubscribeFromAllUrl: string;
	unsubscribeFromEventUrl: string;
	settingsUrl: string;
};

export const notificationEmailHtmlTemplate = (variables: NotificationEmailVariables) => {
	return inline(
		layout
			.replaceAll('{{{ @content }}}', notificationEmail)
			.replaceAll('{{ subject }}', variables.subject)
			.replaceAll('{{ message }}', variables.message)
			.replaceAll('{{ action_button_name }}', variables.actionButtonName)
			.replaceAll('{{ action_button_url }}', variables.actionButtonUrl)
			.replaceAll('{{ product_url }}', variables.product_url)
			.replaceAll('{{ product_name }}', variables.product_name)
			.replaceAll('{{ unsubscribe_from_all_url }}', variables.unsubscribeFromAllUrl)
			.replaceAll('{{ unsubscribe_from_event_url }}', variables.unsubscribeFromEventUrl)
			.replaceAll('{{ settings_url }}', variables.settingsUrl)
	);
};

const sendTestEmail = async (options: {
	from: string;
	to: string;
	subject: string;
	html: string;
}) => {
	try {
		await localClient.sendAsync({
			text: options.subject,
			from: options.from,
			to: options.to,
			subject: options.subject,
			attachment: [{ data: options.html, alternative: true }]
		});
		console.log(`Test email sent to ${options.to}`);
	} catch (e) {
		console.error(e);
	}
};

export const createEmailAuditTrailEntry = async (
	userId: string,
	notificationType: NotificationType
) => {
	await triplitHttpClient.insert('sent_emails', {
		user_id: userId,
		type: notificationType
	});
};

export const createUnsubscribableEmailAuditTrailEntry = async (
	userId: string,
	notificationType: NotificationType
): Promise<string> => {
	const secretToken = generateId(20);

	await triplitHttpClient.insert('sent_emails', {
		user_id: userId,
		type: notificationType,
		secret_token: secretToken
	});
	return secretToken;
};

export const verifyUnsubscribableEmailAuditTrailEntry = async (
	code: string,
	userId: string
): Promise<boolean> => {
	const res = await triplitHttpClient.fetch(
		triplitHttpClient.query('sent_emails').Where(
			and([
				['user_id', '=', userId],
				['secret_token', '=', code]
			])
		)
	);
	if (res.length == 1) {
		return true;
	} else {
		return false;
	}
};

export const sendEmail = async (
	options: {
		from: string;
		to: string;
		subject: string;
		html: string;
		headers?: Record<string, string>;
	},
	notificationType: NotificationType,
	userId: string,
	createAuditDbEntry: boolean = true
) => {
	try {
		if (createAuditDbEntry) {
			await createEmailAuditTrailEntry(userId, notificationType);
		}
		if (dev) {
			return await sendTestEmail(options);
		}

		const resend = new Resend(privateEnv.RESEND_SERVER_TOKEN);
		const result = await resend.emails.send({
			from: options.from,
			to: options.to,
			replyTo: options.from,
			subject: options.subject,
			html: options.html
		});
		console.log(result);
	} catch (e) {
		console.error(`failed to send the email to ${options.to} from ${options.from}`, e);
	}
};

export async function sendEmailNotification(
	userEmail: string,
	type: NotificationType,
	message: string,
	userId: string,
	eventId?: string
): Promise<void> {
	console.log(`Sending email notification to email ${userEmail}:`, message);

	const subject = notificationTypeToSubject[type] ?? 'You have a new notification';

	const settingsUrl = `${publicEnv.PUBLIC_ORIGIN}/settings`;

	const secretToken = await createUnsubscribableEmailAuditTrailEntry(userId, type);
	const unsubscribeFromAllUrl = `${publicEnv.PUBLIC_ORIGIN}/email-subscriptions/unsubscribe?code=${secretToken}&userId=${userId}`;
	const unsubscribeFromEventUrl = `${publicEnv.PUBLIC_ORIGIN}/email-subscriptions/unsubscribe?code=${secretToken}&userId=${userId}&eventId=${eventId}`;

	let notificationsLink = publicEnv.PUBLIC_ORIGIN;
	if (eventId) {
		notificationsLink = `${notificationsLink}/bonfire/${eventId}`;
	}

	await sendEmail(
		{
			from: `${publicEnv.PUBLIC_PROJECT_NAME} <${publicEnv.PUBLIC_FROM_EMAIL}>`,
			to: userEmail,
			subject: subject,
			html: notificationEmailHtmlTemplate({
				subject: subject,
				message: message,
				actionButtonName: 'Click here to see notifications',
				actionButtonUrl: notificationsLink,
				product_url: publicEnv.PUBLIC_ORIGIN,
				product_name: publicEnv.PUBLIC_PROJECT_NAME,
				unsubscribeFromAllUrl: unsubscribeFromAllUrl,
				unsubscribeFromEventUrl: unsubscribeFromEventUrl,
				settingsUrl: settingsUrl
			}),
			headers: {
				'X-Entity-Ref-ID': generateId(20)
			}
		},
		type,
		userId,
		false
	);
}
