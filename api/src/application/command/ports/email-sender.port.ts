import type { Result } from "typescript-result";

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
	send(params: SendEmailParams): Promise<Result<void, Error>>;
}
