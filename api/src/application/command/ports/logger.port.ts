/**
 * Logging port so use cases stay decoupled from Pino / console.
 */
export interface LoggerPort {
  info(obj: Record<string, unknown>, msg?: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
  warn?(obj: Record<string, unknown>, msg?: string): void;
}
