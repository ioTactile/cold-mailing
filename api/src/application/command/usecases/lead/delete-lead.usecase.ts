import { Result } from 'typescript-result';

import type { LeadRepository } from '@/domain/lead/lead.repository.ts';

export class DeleteLeadUsecase {
  private readonly leadRepository: LeadRepository;

  constructor(leadRepository: LeadRepository) {
    this.leadRepository = leadRepository;
  }

  async execute(id: string): Promise<Result<void, Error>> {
    const existing = await this.leadRepository.findById(id);
    if (!existing.ok) {
      return Result.error(existing.error);
    }
    if (existing.value === null) {
      return Result.error(new Error('LEAD_NOT_FOUND'));
    }

    const deleted = await this.leadRepository.delete(id);
    if (!deleted.ok) {
      return Result.error(deleted.error);
    }

    return Result.ok(undefined);
  }
}
