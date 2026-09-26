/**
 * Port de logging pour découpler les use cases de Pino / console.
 */
export interface LoggerPort {
	info(obj: Record<string, unknown>, msg?: string): void;
	error(obj: Record<string, unknown>, msg?: string): void;
	warn?(obj: Record<string, unknown>, msg?: string): void;
}
