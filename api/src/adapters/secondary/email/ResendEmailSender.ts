import { Resend } from "resend";
import type { EmailSenderPort } from "@/application/command/ports/email-sender.port.ts";

const FROM_EMAIL = String(process.env.FROM_EMAIL);

export class ResendEmailSender implements EmailSenderPort {
	async send(params: {
		to: string;
		subject: string;
		html: string;
		from?: string;
	}): Promise<{ ok: true } | { ok: false; error: string }> {
		try {
			const apiKey = process.env.RESEND_API_KEY;
			if (!apiKey) {
				return { ok: false, error: "RESEND_API_KEY non configuré." };
			}
			const resend = new Resend(apiKey);
			const { data, error } = await resend.emails.send({
				from: params.from ?? FROM_EMAIL,
				to: params.to,
				subject: params.subject,
				html: params.html,
			});
			if (error) {
				return { ok: false, error: error.message };
			}
			if (!data?.id) {
				return { ok: false, error: "Réponse Resend invalide." };
			}
			return { ok: true };
		} catch (err) {
			return {
				ok: false,
				error: err instanceof Error ? err.message : String(err),
			};
		}
	}
}
