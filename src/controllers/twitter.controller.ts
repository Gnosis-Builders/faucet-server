import { Controller, Get, Query, Req, Res, UseFilters } from '@nestjs/common';
import { ExceptionsFilter } from 'src/exception.filter';
import { TwitterService } from 'src/services/twitter.service';
import { Response, ResponseUtils } from 'src/utiils';

@Controller()
@UseFilters(ExceptionsFilter)
export class TwitterController {
  constructor(private readonly twitterService: TwitterService) {}

  @Get('/twitter/v1/login')
  async login(@Query('wallet') walletAddress, @Req() req): Promise<Response> {
    let ipAddress = req.headers['x-forwarded-for'];

    if (ipAddress) {
      ipAddress = ipAddress.split(',')[0];
    } else {
      ipAddress = req.socket.remoteAddress;
    }

    return ResponseUtils.getSuccessResponse(await this.twitterService.login(ipAddress, walletAddress));
  }

  @Get('/twitter/v1/callback')
  async callback(@Query('oauth_token') token: string, @Query('oauth_verifier') verifier, @Res() res) {
    const response = await this.twitterService.callback(token, verifier);
    if (response.status === 'success') {
      res.redirect(response.data);
    } else {
      throw new Error(response.message + ' ' + response.data);
    }
  }
}
