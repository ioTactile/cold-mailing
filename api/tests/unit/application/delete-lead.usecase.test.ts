import { Result } from 'typescript-result';
import { describe, expect, it, vi } from 'vitest';
import { DeleteLeadUsecase } from '@/application/command/usecases/lead/delete-lead.usecase.ts';
import type { LeadRepository } from '@/domain/lead/lead.repository.ts';
import type { LeadType } from '@/domain/lead/lead.type.ts';

function createLead(overrides?: Partial<LeadType>): LeadType {
  return {
    id: 'lead-1',
    company: 'Acme',
    domain: 'acme.com',
    email: 'contact@acme.com',
    linkedin: null,
    techStack: null,
    source: 'WTTJ',
    status: 'NEW',
    createdAt: new Date(),
    contactedAt: null,
    ...overrides,
  };
}

describe('DeleteLeadUsecase', () => {
  it('supprime un lead existant', async () => {
    const repo: LeadRepository = {
      findAll: vi.fn(),
      findById: vi.fn().mockResolvedValue(Result.ok(createLead())),
      findByDomain: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      countContactedToday: vi.fn(),
      delete: vi.fn().mockResolvedValue(Result.ok(undefined)),
    };

    const usecase = new DeleteLeadUsecase(repo);

    const result = await usecase.execute('lead-1');

    expect(result.ok).toBe(true);
    expect(repo.findById).toHaveBeenCalledWith('lead-1');
    expect(repo.delete).toHaveBeenCalledWith('lead-1');
  });

  it("retourne LEAD_NOT_FOUND si le lead n'existe pas", async () => {
    const repo: LeadRepository = {
      findAll: vi.fn(),
      findById: vi.fn().mockResolvedValue(Result.ok(null)),
      findByDomain: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      countContactedToday: vi.fn(),
      delete: vi.fn(),
    };

    const usecase = new DeleteLeadUsecase(repo);

    const result = await usecase.execute('unknown-id');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('LEAD_NOT_FOUND');
    }
    expect(repo.delete).not.toHaveBeenCalled();
  });
});
