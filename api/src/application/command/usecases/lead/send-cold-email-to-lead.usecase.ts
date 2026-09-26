import { Result } from 'typescript-result';
import type { EmailSenderPort } from '@/application/command/ports/email-sender.port.ts';
import type { MessageTemplatePort } from '@/application/command/ports/message-template.port.ts';
import type { LeadRepository } from '@/domain/lead/lead.repository.ts';
import type { LeadType } from '@/domain/lead/lead.type.ts';
import { LeadStatus } from '@/domain/lead/lead.type.ts';

const MAX_EMAILS_PER_DAY = 50;

export class SendColdEmailToLeadUsecase {
  private readonly leadRepository: LeadRepository;
  private readonly emailSender: EmailSenderPort;
  private readonly messageTemplate: MessageTemplatePort;
  private readonly maxEmailsPerDay: number;

  constructor(
    leadRepository: LeadRepository,
    emailSender: EmailSenderPort,
    messageTemplate: MessageTemplatePort,
    maxEmailsPerDay: number = MAX_EMAILS_PER_DAY,
  ) {
    this.leadRepository = leadRepository;
    this.emailSender = emailSender;
    this.messageTemplate = messageTemplate;
    this.maxEmailsPerDay = maxEmailsPerDay;
  }

  async execute(leadId: string): Promise<Result<LeadType, Error>> {
    const leadResult = await this.leadRepository.findById(leadId);
    if (!leadResult.ok) return leadResult;
    const lead = leadResult.value;
    if (!lead) {
      return Result.error(new Error('LEAD_NOT_FOUND'));
    }
    if (!lead.email?.trim()) {
      return Result.error(new Error('LEAD_NO_EMAIL'));
    }
    if (lead.status === LeadStatus.CONTACTED) {
      return Result.error(new Error('LEAD_ALREADY_CONTACTED'));
    }

    const countResult = await this.leadRepository.countContactedToday();
    if (!countResult.ok) return countResult;
    if (countResult.value >= this.maxEmailsPerDay) {
      return Result.error(new Error('DAILY_LIMIT_REACHED'));
    }

    const { subject, html } = this.messageTemplate.renderColdEmail(lead);
    const sendResult = await this.emailSender.send({
      to: lead.email,
      subject,
      html,
    });

    if (!sendResult.ok) {
      return sendResult;
    }

    const updatedLead: LeadType = {
      ...lead,
      status: LeadStatus.CONTACTED,
      contactedAt: new Date(),
    };
    const updateResult = await this.leadRepository.update(updatedLead);
    if (!updateResult.ok) return updateResult;
    return Result.ok(updateResult.value);
  }
}
