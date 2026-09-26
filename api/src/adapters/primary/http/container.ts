import { DefaultMessageTemplateAdapter } from "@/adapters/secondary/email/DefaultMessageTemplateAdapter.ts";
import { ResendEmailSender } from "@/adapters/secondary/email/ResendEmailSender.ts";
import { HttpEmailFinderAdapter } from "@/adapters/secondary/email-finder/HttpEmailFinderAdapter.ts";
import { GoogleMapsGeocoderAdapter } from "@/adapters/secondary/geocoding/GoogleMapsGeocoderAdapter.ts";
import { PinoLoggerAdapter } from "@/adapters/secondary/logging/PinoLoggerAdapter.ts";
import { PrismaLeadRepository } from "@/adapters/secondary/persistence/PrismaLeadRepository.ts";
import { PrismaUserRepository } from "@/adapters/secondary/persistence/PrismaUserRepository.ts";
import { IndeedJobBoardScraperAdapter } from "@/adapters/secondary/scraper/IndeedJobBoardScraperAdapter.ts";
import { WttjJobBoardScraperAdapter } from "@/adapters/secondary/scraper/WttjJobBoardScraperAdapter.ts";
import { BcryptPasswordHasher } from "@/adapters/secondary/security/BcryptPasswordHasher.ts";
import type { AuthTokenPort } from "@/application/command/ports/auth-token.port.ts";
import { CreateLeadUsecase } from "@/application/command/usecases/lead/create-lead.usecase.ts";
import { DeleteLeadUsecase } from "@/application/command/usecases/lead/delete-lead.usecase.ts";
import { DiscoverLeadsUsecase } from "@/application/command/usecases/lead/discover-leads.usecase.ts";
import { GetLinkedInMessageForLeadUsecase } from "@/application/command/usecases/lead/get-linkedin-message-for-lead.usecase.ts";
import { SendColdEmailToLeadUsecase } from "@/application/command/usecases/lead/send-cold-email-to-lead.usecase.ts";
import { UpdateLeadStatusUsecase } from "@/application/command/usecases/lead/update-lead-status.usecase.ts";
import { LoginUsecase } from "@/application/command/usecases/user/login.usecase.ts";
import { RefreshTokenUsecase } from "@/application/command/usecases/user/refresh-token.usecase.ts";
import { RegisterUserUsecase } from "@/application/command/usecases/user/register-user.usecase.ts";
import { GeocodeAddressUsecase } from "@/application/query/usecases/geocode-address.usecase.ts";
import { GetLeadByIdUsecase } from "@/application/query/usecases/lead/get-lead-by-id.usecase.ts";
import { ListLeadsUsecase } from "@/application/query/usecases/lead/list-leads.usecase.ts";
import { GetUserByIdUsecase } from "@/application/query/usecases/user/get-user-by-id.usecase.ts";
import { LeadSource } from "@/domain/lead/lead.type.ts";

export interface AppContainer {
	registerUserUsecase: RegisterUserUsecase;
	loginUsecase: LoginUsecase;
	refreshTokenUsecase: RefreshTokenUsecase;
	getUserByIdUsecase: GetUserByIdUsecase;
	listLeadsUsecase: ListLeadsUsecase;
	getLeadByIdUsecase: GetLeadByIdUsecase;
	createLeadUsecase: CreateLeadUsecase;
	updateLeadStatusUsecase: UpdateLeadStatusUsecase;
	deleteLeadUsecase: DeleteLeadUsecase;
	discoverLeadsUsecase: DiscoverLeadsUsecase;
	sendColdEmailToLeadUsecase: SendColdEmailToLeadUsecase;
	getLinkedInMessageForLeadUsecase: GetLinkedInMessageForLeadUsecase;
	geocodeAddressUsecase: GeocodeAddressUsecase;
}

/**
 * Composition root : assemble adapters secondaires et use cases.
 * Les routes HTTP ne doivent plus instancier Prisma / Resend directement.
 */
export function createAppContainer(authToken: AuthTokenPort): AppContainer {
	const userRepository = new PrismaUserRepository();
	const leadRepository = new PrismaLeadRepository();
	const passwordHasher = new BcryptPasswordHasher();
	const emailSender = new ResendEmailSender();
	const messageTemplate = new DefaultMessageTemplateAdapter();
	const emailFinder = new HttpEmailFinderAdapter();
	const logger = new PinoLoggerAdapter();
	const geocoder = new GoogleMapsGeocoderAdapter();

	const createLeadUsecase = new CreateLeadUsecase(leadRepository);

	return {
		registerUserUsecase: new RegisterUserUsecase(
			userRepository,
			passwordHasher,
		),
		loginUsecase: new LoginUsecase(userRepository, passwordHasher, authToken),
		refreshTokenUsecase: new RefreshTokenUsecase(authToken),
		getUserByIdUsecase: new GetUserByIdUsecase(userRepository),
		listLeadsUsecase: new ListLeadsUsecase(leadRepository),
		getLeadByIdUsecase: new GetLeadByIdUsecase(leadRepository),
		createLeadUsecase,
		updateLeadStatusUsecase: new UpdateLeadStatusUsecase(leadRepository),
		deleteLeadUsecase: new DeleteLeadUsecase(leadRepository),
		discoverLeadsUsecase: new DiscoverLeadsUsecase(
			leadRepository,
			createLeadUsecase,
			{
				[LeadSource.WTTJ]: new WttjJobBoardScraperAdapter(),
				[LeadSource.INDEED]: new IndeedJobBoardScraperAdapter(),
			},
			emailFinder,
			logger,
		),
		sendColdEmailToLeadUsecase: new SendColdEmailToLeadUsecase(
			leadRepository,
			emailSender,
			messageTemplate,
		),
		getLinkedInMessageForLeadUsecase: new GetLinkedInMessageForLeadUsecase(
			leadRepository,
			messageTemplate,
		),
		geocodeAddressUsecase: new GeocodeAddressUsecase(geocoder),
	};
}
