import { Result } from 'typescript-result';
import { describe, expect, it, vi } from 'vitest';
import { CreateLeadUsecase } from '@/application/command/usecases/lead/create-lead.usecase.ts';
import type { LeadRepository } from '@/domain/lead/lead.repository.ts';
import type { LeadType } from '@/domain/lead/lead.type.ts';
import { LeadSource, LeadStatus } from '@/domain/lead/lead.type.ts';

describe('CreateLeadUsecase', () => {
  it('délègue la création au repository avec status NEW par défaut', async () => {
    const created: LeadType = {
      id: '1',
      company: 'Acme',
      domain: 'acme.com',
      email: null,
      linkedin: null,
      techStack: null,
      source: LeadSource.WTTJ,
      status: LeadStatus.NEW,
      createdAt: new Date(),
      contactedAt: null,
    };
    const repo: LeadRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByDomain: vi.fn(),
      create: vi.fn().mockResolvedValue(Result.ok(created)),
      update: vi.fn(),
      countContactedToday: vi.fn(),
      delete: vi.fn(),
    };

    const usecase = new CreateLeadUsecase(repo);
    const result = await usecase.execute({
      company: 'Acme',
      domain: 'acme.com',
      source: LeadSource.WTTJ,
    });

    expect(result.ok).toBe(true);
    expect(repo.create).toHaveBeenCalledWith({
      company: 'Acme',
      domain: 'acme.com',
      email: null,
      linkedin: null,
      techStack: null,
      source: LeadSource.WTTJ,
      status: LeadStatus.NEW,
    });
  });
});
