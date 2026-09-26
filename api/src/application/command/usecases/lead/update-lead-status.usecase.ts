import { Result } from 'typescript-result';
import type { LeadRepository } from '@/domain/lead/lead.repository.ts';
import type { LeadStatus, LeadType } from '@/domain/lead/lead.type.ts';

export class UpdateLeadStatusUsecase {
  private readonly leadRepository: LeadRepository;

  constructor(leadRepository: LeadRepository) {
    this.leadRepository = leadRepository;
  }

  async execute(id: string, status: LeadStatus): Promise<Result<LeadType, Error>> {
    const existing = await this.leadRepository.findById(id);
    if (!existing.ok) return existing;
    if (existing.value === null) {
      return Result.error(new Error('LEAD_NOT_FOUND'));
    }
    const lead: LeadType = { ...existing.value, status };
    return this.leadRepository.update(lead);
  }
}
