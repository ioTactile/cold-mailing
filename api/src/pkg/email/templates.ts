import type { LeadType } from '@/domain/lead/lead.type.ts';

const DEFAULT_SUBJECT = 'Développeur Next.js / React – collaboration';

const DEFAULT_BODY = `Bonjour,

J'ai vu que {{company}} recrute ou travaille avec des profils React / Next.js.

Je suis développeur fullstack orienté frontend (Next.js, React, Node.js) et je serais ravi d'échanger sur un projet ou une mission.

Bien cordialement,
`;

/**
 * Replace {{key}} placeholders in a string.
 */
function replacePlaceholders(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? '');
}

export function renderColdEmailTemplate(lead: LeadType): {
  subject: string;
  html: string;
} {
  const data: Record<string, string> = {
    company: lead.company,
    domain: lead.domain,
    email: lead.email ?? '',
  };
  const subject = replacePlaceholders(DEFAULT_SUBJECT, data);
  const body = replacePlaceholders(DEFAULT_BODY, data);
  const html = `<p style="white-space: pre-line;">${body.replace(/\n/g, '<br/>')}</p>`;
  return { subject, html };
}
