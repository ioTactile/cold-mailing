import type { LoggerPort } from '@/application/command/ports/logger.port.ts';
import { logger } from '@/pkg/logger/index.ts';

export class PinoLoggerAdapter implements LoggerPort {
  info(obj: Record<string, unknown>, msg?: string): void {
    logger.info(obj, msg);
  }

  error(obj: Record<string, unknown>, msg?: string): void {
    logger.error(obj, msg);
  }

  warn(obj: Record<string, unknown>, msg?: string): void {
    logger.warn(obj, msg);
  }
}
