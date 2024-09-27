import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    return from(next.handle().pipe(
      catchError((error) => {
        // Log unexpected errors for debugging
        console.error('Unexpected error:', error);

        // Determine the response status and message
        const status = error instanceof HttpException 
          ? error.getStatus() 
          : HttpStatus.INTERNAL_SERVER_ERROR;

        const message = error instanceof HttpException 
          ? error.getResponse() 
          : (error instanceof Error ? error.message : String(error));

        // Throw a new HttpException with consistent error structure
        throw new HttpException({
          statusCode: status,
          message: message || 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
          path: context.switchToHttp().getRequest().url, // Include request URL for context
        }, status);
      }),
    ));
  }
}
