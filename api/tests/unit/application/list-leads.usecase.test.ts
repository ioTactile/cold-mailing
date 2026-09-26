import { Result } from 'typescript-result';
import { describe, expect, it, vi } from 'vitest';
import { ListLeadsUsecase } from '@/application/query/usecases/lead/list-leads.usecase.ts';
import type { LeadRepository } from '@/domain/lead/lead.repository.ts';
import type { LeadType } from '@/domain/lead/lead.type.ts';
import { LeadStatus } from '@/domain/lead/lead.type.ts';

describe('ListLeadsUsecase', () => {
  it('enrichit les leads avec les URLs LinkedIn de recherche', async () => {
    const lead: LeadType = {
      id: '1',
      company: 'Acme SAS',
      domain: 'acme.com',
      email: null,
      linkedin: null,
      techStack: null,
      source: 'WTTJ',
      status: LeadStatus.NEW,
      createdAt: new Date(),
      contactedAt: null,
    };
    const repo: LeadRepository = {
      findAll: vi.fn().mockResolvedValue(Result.ok([lead])),
      findById: vi.fn(),
      findByDomain: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      countContactedToday: vi.fn(),
      delete: vi.fn(),
    };

    const usecase = new ListLeadsUsecase(repo);
    const result = await usecase.execute({ status: LeadStatus.NEW });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]?.linkedinPeopleSearchUrl).toContain('linkedin.com');
      expect(result.value[0]?.linkedinCompanySearchUrl).toContain('linkedin.com');
    }
  });
});
