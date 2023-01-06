import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { RequestAmountsEntity } from 'src/entities/request.amount.entity';
import { RequestToken } from 'src/utils/dtos';
import { Repository } from 'typeorm';

@Injectable()
export class RequestAmountService {
  private readonly logger = new Logger(RequestAmountService.name);

  @InjectRepository(RequestAmountsEntity) requestAmountRepository: Repository<RequestAmountsEntity>;
  constructor(private mailerService: MailerService, private configService: ConfigService) {
    this.logger.debug('RequestAmountService Loaded');
  }

  async checkAmount(request: RequestToken, ipAddress: string): Promise<void> {
    this.logger.debug('checkAmount');
    // get request amount from repository
    const requestAmount = await this.requestAmountRepository
      .createQueryBuilder('request_amounts')
      .where('ipAddress = :ia', { ia: ipAddress })
      .orWhere('walletAddress = :wa', { ln: request.walletAddress })
      .getOne();
    if (requestAmount) {
      if (requestAmount.cumulativeAmount >= Number(this.configService.get<number>("ALERT_AMOUNT"))) {
        const thirtyDays = Number(this.configService.get<number>('RESET_PERIOD')) * 24 * 60 * 60 * 1000;
        const now = new Date().getTime();
        // send one alert every thirty days
        if (requestAmount.alertDate + thirtyDays > now && requestAmount.alertSent === true) {
          return;
        }
        // send an alert email
        this.sendAlertEmail(request.walletAddress, ipAddress);
        requestAmount.alertSent = true;
        requestAmount.alertDate = Date.now();
        await this.requestAmountRepository.save(requestAmount);
      }

      requestAmount.cumulativeAmount += Number(request.amount);
      await this.requestAmountRepository.save(requestAmount);
    } else {
      const newRequestAmount = {
        ipAddress,
        walletAddress: request.walletAddress,
        cumulativeAmount: Number(request.amount),
        alertSent: false,
        alertDate: 0,
      };
      await this.requestAmountRepository.save(newRequestAmount);
    }
  }

  async sendAlertEmail(walletAddress: string, ipAddress: string): Promise<void> {
    this.logger.debug('sendAlertEmail');
    const email = `
        <p>The below wallet/ip address is requesting more that ${this.configService.get<string>('ALERT_AMOUNT')} xDAI</p>
        <p>Wallet Address: ${walletAddress}</p>
        <p>IP Address: ${ipAddress}</p>
    `;
    await this.mailerService
      .sendMail({
        to: this.configService.get<string>('ALERT_EMAILS'),
        from: this.configService.get<string>('SMTP_FROM'),
        subject: 'Alert: Action Required',
        text: email,
        html: email,
      })
      .then((info) => this.logger.debug(info))
      .catch((error) => this.logger.error(error));
  }
}
