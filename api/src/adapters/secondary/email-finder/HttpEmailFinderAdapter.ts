import type {
	EmailFinderPort,
	FindEmailsResult,
} from "@/application/command/ports/email-finder.port.ts";
import { findEmailsForDomain } from "@/pkg/email-finder/find-emails.ts";

export class HttpEmailFinderAdapter implements EmailFinderPort {
	findEmailsForDomain(domain: string): Promise<FindEmailsResult> {
		return findEmailsForDomain(domain);
	}
}
