import type { LeadSource } from '@/domain/lead/lead.type.ts';

export interface JobOffer {
  companyName: string;
  companyWebsiteUrl: string;
  source: LeadSource;
}

export interface JobSearchLocation {
  label?: string;
  radiusKm?: number;
  lat?: number;
  lng?: number;
}

/**
 * Port for searching job listings on a job board (WTTJ, Indeed, etc.).
 */
export interface JobBoardScraperPort {
  search(query: string, limit: number, location?: JobSearchLocation): Promise<JobOffer[]>;
}
