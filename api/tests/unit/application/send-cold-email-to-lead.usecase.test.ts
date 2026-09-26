import { Result } from 'typescript-result';
import { describe, expect, it, vi } from 'vitest';
import type { EmailSenderPort } from '@/application/command/ports/email-sender.port.ts';
import type { MessageTemplatePort } from '@/application/command/ports/message-template.port.ts';
import { SendColdEmailToLeadUsecase } from '@/application/command/usecases/lead/send-cold-email-to-lead.usecase.ts';
import type { LeadRepository } from '@/domain/lead/lead.repository.ts';
import type { LeadType } from '@/domain/lead/lead.type.ts';
import { LeadStatus } from '@/domain/lead/lead.type.ts';

function createLead(overrides?: Partial<LeadType>): LeadType {
  return {
    id: 'lead-1',
    company: 'Acme',
    domain: 'acme.com',
    email: 'contact@acme.com',
    linkedin: null,
    techStack: null,
    source: 'WTTJ',
    status: LeadStatus.NEW,
    createdAt: new Date(),
    contactedAt: null,
    ...overrides,
  };
}

function createRepo(overrides: Partial<LeadRepository> = {}): LeadRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByDomain: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    countContactedToday: vi.fn().mockResolvedValue(Result.ok(0)),
    delete: vi.fn(),
    ...overrides,
  };
}

describe('SendColdEmailToLeadUsecase', () => {
  const template: MessageTemplatePort = {
    renderColdEmail: vi.fn().mockReturnValue({
      subject: 'Sujet',
      html: '<p>Corps</p>',
    }),
    renderLinkedInMessage: vi.fn(),
  };

  it("envoie l'email et passe le lead en CONTACTED", async () => {
    const lead = createLead();
    const updated = createLead({
      status: LeadStatus.CONTACTED,
      contactedAt: new Date(),
    });
    const repo = createRepo({
      findById: vi.fn().mockResolvedValue(Result.ok(lead)),
      update: vi.fn().mockResolvedValue(Result.ok(updated)),
    });
    const emailSender: EmailSenderPort = {
      send: vi.fn().mockResolvedValue(Result.ok(undefined)),
    };

    const usecase = new SendColdEmailToLeadUsecase(repo, emailSender, template);
    const result = await usecase.execute('lead-1');

    expect(result.ok).toBe(true);
    expect(emailSender.send).toHaveBeenCalledWith({
      to: 'contact@acme.com',
      subject: 'Sujet',
      html: '<p>Corps</p>',
    });
    expect(repo.update).toHaveBeenCalled();
  });

  it('retourne LEAD_NOT_FOUND', async () => {
    const repo = createRepo({
      findById: vi.fn().mockResolvedValue(Result.ok(null)),
    });
    const usecase = new SendColdEmailToLeadUsecase(repo, { send: vi.fn() }, template);

    const result = await usecase.execute('missing');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('LEAD_NOT_FOUND');
  });

  it('retourne LEAD_NO_EMAIL', async () => {
    const repo = createRepo({
      findById: vi.fn().mockResolvedValue(Result.ok(createLead({ email: null }))),
    });
    const usecase = new SendColdEmailToLeadUsecase(repo, { send: vi.fn() }, template);

    const result = await usecase.execute('lead-1');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('LEAD_NO_EMAIL');
  });

  it('retourne LEAD_ALREADY_CONTACTED', async () => {
    const repo = createRepo({
      findById: vi.fn().mockResolvedValue(Result.ok(createLead({ status: LeadStatus.CONTACTED }))),
    });
    const usecase = new SendColdEmailToLeadUsecase(repo, { send: vi.fn() }, template);

    const result = await usecase.execute('lead-1');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('LEAD_ALREADY_CONTACTED');
    }
  });

  it('retourne DAILY_LIMIT_REACHED', async () => {
    const repo = createRepo({
      findById: vi.fn().mockResolvedValue(Result.ok(createLead())),
      countContactedToday: vi.fn().mockResolvedValue(Result.ok(50)),
    });
    const usecase = new SendColdEmailToLeadUsecase(repo, { send: vi.fn() }, template, 50);

    const result = await usecase.execute('lead-1');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('DAILY_LIMIT_REACHED');
    }
  });
});
