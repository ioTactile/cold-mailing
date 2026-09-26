import { Result } from 'typescript-result';
import { describe, expect, it, vi } from 'vitest';
import type { EmailFinderPort } from '@/application/command/ports/email-finder.port.ts';
import type { JobBoardScraperPort } from '@/application/command/ports/job-board-scraper.port.ts';
import type { LoggerPort } from '@/application/command/ports/logger.port.ts';
import type { CreateLeadUsecase } from '@/application/command/usecases/lead/create-lead.usecase.ts';
import {
  type DiscoverEvent,
  DiscoverLeadsUsecase,
} from '@/application/command/usecases/lead/discover-leads.usecase.ts';
import type { LeadRepository } from '@/domain/lead/lead.repository.ts';
import type { LeadType } from '@/domain/lead/lead.type.ts';
import { LeadSource, LeadStatus } from '@/domain/lead/lead.type.ts';

function createLead(overrides?: Partial<LeadType>): LeadType {
  return {
    id: 'lead-1',
    company: 'Acme',
    domain: 'acme.com',
    email: 'hello@acme.com',
    linkedin: null,
    techStack: null,
    source: LeadSource.WTTJ,
    status: LeadStatus.NEW,
    createdAt: new Date(),
    contactedAt: null,
    ...overrides,
  };
}

describe('DiscoverLeadsUsecase', () => {
  const logger: LoggerPort = {
    info: vi.fn(),
    error: vi.fn(),
  };

  it('crée un lead pour une offre avec domaine externe', async () => {
    const events: DiscoverEvent[] = [];
    const scraper: JobBoardScraperPort = {
      search: vi.fn().mockResolvedValue([
        {
          companyName: 'Acme',
          companyWebsiteUrl: 'https://www.acme.com/about',
          source: LeadSource.WTTJ,
        },
      ]),
    };
    const emailFinder: EmailFinderPort = {
      findEmailsForDomain: vi
        .fn()
        .mockResolvedValue({ emails: ['hello@acme.com'], pagesCrawled: 1 }),
    };
    const created = createLead();
    const repo: LeadRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByDomain: vi.fn().mockResolvedValue(Result.ok(null)),
      create: vi.fn(),
      update: vi.fn(),
      countContactedToday: vi.fn(),
      delete: vi.fn(),
    };
    const createLeadUsecase = {
      execute: vi.fn().mockResolvedValue(Result.ok(created)),
    } as unknown as CreateLeadUsecase;

    const usecase = new DiscoverLeadsUsecase(
      repo,
      createLeadUsecase,
      { [LeadSource.WTTJ]: scraper },
      emailFinder,
      logger,
    );

    await usecase.execute({ source: LeadSource.WTTJ, query: 'react', limit: 5 }, async (e) => {
      events.push(e);
    });

    expect(scraper.search).toHaveBeenCalled();
    expect(createLeadUsecase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        company: 'Acme',
        domain: 'acme.com',
        email: 'hello@acme.com',
      }),
    );
    expect(events.some((e) => e.type === 'lead_created')).toBe(true);
    expect(events.some((e) => e.type === 'done')).toBe(true);
  });

  it('ignore les domaines de plateforme (WTTJ)', async () => {
    const events: DiscoverEvent[] = [];
    const scraper: JobBoardScraperPort = {
      search: vi.fn().mockResolvedValue([
        {
          companyName: 'WTTJ itself',
          companyWebsiteUrl: 'https://www.welcometothejungle.com/fr',
          source: LeadSource.WTTJ,
        },
      ]),
    };
    const createLeadUsecase = {
      execute: vi.fn(),
    } as unknown as CreateLeadUsecase;
    const repo: LeadRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByDomain: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      countContactedToday: vi.fn(),
      delete: vi.fn(),
    };

    const usecase = new DiscoverLeadsUsecase(
      repo,
      createLeadUsecase,
      { [LeadSource.WTTJ]: scraper },
      { findEmailsForDomain: vi.fn() },
      logger,
    );

    await usecase.execute({ source: LeadSource.WTTJ, query: 'react', limit: 5 }, async (e) => {
      events.push(e);
    });

    expect(createLeadUsecase.execute).not.toHaveBeenCalled();
    expect(events.some((e) => e.type === 'skip')).toBe(true);
  });

  it('ignore un domaine déjà en base', async () => {
    const events: DiscoverEvent[] = [];
    const scraper: JobBoardScraperPort = {
      search: vi.fn().mockResolvedValue([
        {
          companyName: 'Acme',
          companyWebsiteUrl: 'https://acme.com',
          source: LeadSource.WTTJ,
        },
      ]),
    };
    const createLeadUsecase = {
      execute: vi.fn(),
    } as unknown as CreateLeadUsecase;
    const repo: LeadRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByDomain: vi.fn().mockResolvedValue(Result.ok(createLead())),
      create: vi.fn(),
      update: vi.fn(),
      countContactedToday: vi.fn(),
      delete: vi.fn(),
    };

    const usecase = new DiscoverLeadsUsecase(
      repo,
      createLeadUsecase,
      { [LeadSource.WTTJ]: scraper },
      { findEmailsForDomain: vi.fn() },
      logger,
    );

    await usecase.execute({ source: LeadSource.WTTJ, query: 'react', limit: 5 }, async (e) => {
      events.push(e);
    });

    expect(createLeadUsecase.execute).not.toHaveBeenCalled();
    expect(events.some((e) => e.type === 'skip' && e.reason === 'Déjà en base')).toBe(true);
  });
});
