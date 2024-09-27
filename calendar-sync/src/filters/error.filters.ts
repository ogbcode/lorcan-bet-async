import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class ErrorFilter implements ExceptionFilter {
  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Handle known HttpExceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse() as
        | string
        | { message: string | string[] };

      // Extract error message(s)
      message = this.extractErrorMessage(errorResponse);
    } else {
      // Log unexpected errors for debugging
      console.error('Unexpected error:', exception);
    }

    // Send the error response
    const errorResponse = {
      error: {
        statusCode: status,
        message: message || 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    response.status(status).json(errorResponse);
    console.error(errorResponse);
  }

  private extractErrorMessage(
    errorResponse: string | { message: string | string[] },
  ): string {
    if (typeof errorResponse === 'object' && 'message' in errorResponse) {
      return Array.isArray(errorResponse.message)
        ? errorResponse.message.join(', ') // Join multiple error messages
        : errorResponse.message;
    }
    return errorResponse as string;
  }
}
