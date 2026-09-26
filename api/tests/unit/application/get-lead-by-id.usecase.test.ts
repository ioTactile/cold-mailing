import { Result } from 'typescript-result';
import { describe, expect, it, vi } from 'vitest';
import { GetLeadByIdUsecase } from '@/application/query/usecases/lead/get-lead-by-id.usecase.ts';
import type { LeadRepository } from '@/domain/lead/lead.repository.ts';
import type { LeadType } from '@/domain/lead/lead.type.ts';
import { LeadStatus } from '@/domain/lead/lead.type.ts';

describe('GetLeadByIdUsecase', () => {
  it('enrichit le lead trouvé', async () => {
    const lead: LeadType = {
      id: '1',
      company: 'Acme',
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
      findAll: vi.fn(),
      findById: vi.fn().mockResolvedValue(Result.ok(lead)),
      findByDomain: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      countContactedToday: vi.fn(),
      delete: vi.fn(),
    };

    const usecase = new GetLeadByIdUsecase(repo);
    const result = await usecase.execute('1');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value?.linkedinPeopleSearchUrl).toBeDefined();
    }
  });

  it('retourne null si absent', async () => {
    const repo: LeadRepository = {
      findAll: vi.fn(),
      findById: vi.fn().mockResolvedValue(Result.ok(null)),
      findByDomain: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      countContactedToday: vi.fn(),
      delete: vi.fn(),
    };

    const usecase = new GetLeadByIdUsecase(repo);
    const result = await usecase.execute('missing');

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBeNull();
  });
});
