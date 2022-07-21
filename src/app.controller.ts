import { Body, Controller, Get, Post, Req, UseFilters } from '@nestjs/common';
import { AppService } from './app.service';
import { RequestToken } from './dtos';
import { ExceptionsFilter } from "./exception.filter";
import { Response, ResponseUtils } from './utiils';

@Controller()
@UseFilters(ExceptionsFilter)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/request-token')
  async requestToken(@Body() request: RequestToken, @Req() req): Promise<Response> {
    let ipAddress = req.headers['x-forwarded-for'];
    
    if(ipAddress) {
      ipAddress = ipAddress.split(",")[0]
    } else {
      ipAddress = req.socket.remoteAddress;
    }
    
    console.log("FF: ", req.headers['x-forwarded-for']);
    return ResponseUtils.getSuccessResponse(await this.appService.requestToken(request, ipAddress));
  }
}
