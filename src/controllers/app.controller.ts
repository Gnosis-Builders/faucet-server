import { Body, Controller, Get, Post, Req, UseFilters } from '@nestjs/common';
import { AppService } from '../services/app.service';
import { RequestToken } from '../utils/dtos';
import { ExceptionsFilter } from '../filters/exception.filter';
import { Response, ResponseUtils } from '../utils/common';

@Controller()
@UseFilters(ExceptionsFilter)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/request-token')
  async requestToken(@Body() request: RequestToken, @Req() req): Promise<Response> {
    let ipAddress = req.headers['x-forwarded-for'];

    if (ipAddress !== undefined) {
      ipAddress = ipAddress.split(',')[0];
    } else {
      ipAddress = req.socket.remoteAddress;
    }

    return ResponseUtils.getSuccessResponse(await this.appService.requestToken(request, ipAddress), '');
  }
}
