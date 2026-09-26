import type { LeadType } from '@/domain/lead/lead.type.ts';

const DEFAULT_MESSAGE = `Bonjour,

J'ai repéré {{company}} et votre activité. Je suis développeur fullstack orienté frontend (Next.js, React, Node.js) et je serais ravi d'échanger pour une collaboration ou une mission.

Bien cordialement,
`;

function replacePlaceholders(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? '');
}

export function renderLinkedInMessage(lead: LeadType): string {
  const data: Record<string, string> = {
    company: lead.company,
    domain: lead.domain,
  };
  return replacePlaceholders(DEFAULT_MESSAGE, data).trim();
}
