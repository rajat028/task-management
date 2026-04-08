import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  errors?: Record<string, string[]>;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof exceptionResponse.message === 'string'
          ? exceptionResponse.message
          : exceptionResponse.message || exception.message,
    };

    if (exceptionResponse.errors) {
      errorResponse.errors = exceptionResponse.errors;
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Error: ${request.method} ${request.url}`,
        exception.stack,
      );
    } else {
      this.logger.warn(
        `Client Error: ${request.method} ${request.url} - ${errorResponse.message}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
