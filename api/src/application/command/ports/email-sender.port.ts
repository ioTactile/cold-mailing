export interface SendEmailParams {
	to: string;
	subject: string;
	html: string;
	from?: string;
}

/**
 * Port pour l'envoi d'emails.
 * L'implémentation (ex. SMTP, Resend) reste dans les adapters.
 */
export interface EmailSenderPort {
	/** Envoi un email. */
	send(
		params: SendEmailParams,
	): Promise<{ ok: true } | { ok: false; error: string }>;
}
