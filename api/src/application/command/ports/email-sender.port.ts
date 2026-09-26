import type { Result } from 'typescript-result';

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Port for sending emails.
 * Implementation (e.g. SMTP, Resend) lives in adapters.
 */
export interface EmailSenderPort {
  send(params: SendEmailParams): Promise<Result<void, Error>>;
}
