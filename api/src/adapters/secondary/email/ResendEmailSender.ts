import { Resend } from 'resend';
import { Result } from 'typescript-result';
import type { EmailSenderPort } from '@/application/command/ports/email-sender.port.ts';

const FROM_EMAIL = String(process.env.FROM_EMAIL);

export class ResendEmailSender implements EmailSenderPort {
  async send(params: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }): Promise<Result<void, Error>> {
    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        return Result.error(new Error('RESEND_API_KEY non configuré.'));
      }
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({
        from: params.from ?? FROM_EMAIL,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
      if (error) {
        return Result.error(new Error(error.message));
      }
      if (!data?.id) {
        return Result.error(new Error('Réponse Resend invalide.'));
      }
      return Result.ok(undefined);
    } catch (err) {
      return Result.error(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
