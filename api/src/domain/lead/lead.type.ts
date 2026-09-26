export const LeadStatus = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  REPLIED: 'REPLIED',
  INTERESTED: 'INTERESTED',
  CLOSED: 'CLOSED',
} as const;

export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const LeadSource = {
  WTTJ: 'WTTJ',
  INDEED: 'INDEED',
} as const;

export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

const LEAD_SOURCES: LeadSource[] = Object.values(LeadSource);

export function isLeadSource(value: string): value is LeadSource {
  return (LEAD_SOURCES as string[]).includes(value);
}

export function toLeadSource(value: string): LeadSource {
  if (isLeadSource(value)) {
    return value;
  }
  throw new Error(`Source de prospects invalide: ${value}`);
}

export interface LeadType {
  id: string;
  company: string;
  domain: string;
  email: string | null;
  linkedin: string | null;
  techStack: string | null;
  source: LeadSource;
  status: LeadStatus;
  createdAt: Date;
  contactedAt: Date | null;
}

export interface CreateLeadInputType {
  company: string;
  domain: string;
  email?: string | null;
  linkedin?: string | null;
  techStack?: string | null;
  source: LeadSource;
  status?: LeadStatus;
}

export interface LinkedinSearchUrls {
  linkedinCompanySearchUrl: string;
  linkedinPeopleSearchUrl: string;
}

export function buildLinkedinSearchQueries(company: string, domain?: string): LinkedinSearchUrls {
  let keyword = company.trim();

  if (!keyword && domain) {
    let normalized = domain.trim().toLowerCase();
    normalized = normalized.replace(/^https?:\/\//, '').replace(/^www\./, '');
    const parts = normalized.split('.');
    keyword = parts[0] ?? '';
  }

  if (!keyword) {
    throw new Error("Nom d'entreprise ou domaine requis pour générer une recherche LinkedIn.");
  }

  const companyQuery = encodeURIComponent(keyword);
  const peopleQuery = encodeURIComponent(`recruteur ${keyword}`);

  return {
    linkedinCompanySearchUrl: `https://www.linkedin.com/search/results/companies/?keywords=${companyQuery}`,
    linkedinPeopleSearchUrl: `https://www.linkedin.com/search/results/people/?keywords=${peopleQuery}`,
  };
}
