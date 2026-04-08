import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.debug(
          `${method} ${url} | Status: ${response.statusCode} | Duration: ${duration}ms | IP: ${ip}`,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.logger.warn(
          `${method} ${url} | Status: ${error.status || 500} | Duration: ${duration}ms | Error: ${error.message}`,
        );
        throw error;
      }),
    );
  }
}
