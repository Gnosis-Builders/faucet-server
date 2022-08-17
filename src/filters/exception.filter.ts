import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ExceptionsFilter.name);

  catch(exception, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    this.logger.error('Error: ');
    this.logger.error(exception);
    let message = exception;
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (exception.message) {
      message = exception.message;
    }
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (exception.response) {
      message = exception.response.message;
    }

    if (message.indexOf !== undefined) {
      if (message.indexOf('not found') >= 0) {
        status = HttpStatus.NOT_FOUND;
      }
    }

    response.status(status).json({
      status: 'error',
      data: {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        error: message,
      },
    });
  }
}
