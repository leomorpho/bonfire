import { env as privateEnv } from '$env/dynamic/private';
import twilio from 'twilio';
import { triplitHttpClient } from './server/triplit';

const client = twilio(privateEnv.TWILIO_ACCOUNT_SID, privateEnv.TWILIO_AUTH_TOKEN);

/**
 * Sends a text message using Twilio.
 *
 * @param {string} to - The recipient's phone number in E.164 format.
 * @param {string} body - The content of the message.
 * @returns {Promise<string>} The SID of the sent message.
 */
export async function sendSmsMessage(toUserId: string, to: string, body: string) {
    try {
		const message = await client.messages.create({
			from: privateEnv.TWILIO_PHONE_NUMBER,
			to,
			body
		});

		// Add audit log
		await triplitHttpClient.insert('sent_notification_sms', {
			user_id: toUserId,
			content: body
		});

		console.log('Message SID:', message.sid);
		return message.sid;
	} catch (error) {
		console.error('Error sending message:', error);
		throw error;
	}
}
