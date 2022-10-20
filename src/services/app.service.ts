import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RequestToken } from '../utils/dtos';
import { ethers, Wallet } from 'ethers';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { decrypt } from 'src/utils/common';
import TwitterApi from 'twitter-api-v2';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  private provider: ethers.providers.JsonRpcProvider;

  @InjectRepository(UserEntity) userRepository: Repository<UserEntity>;

  constructor(private configService: ConfigService) {
    this.logger.debug('AppService Loaded');
  }

  private async connectWeb3(chain: string) {
    if (chain.indexOf('Optimism') >= 0) {
      chain = 'Optimism';
    }

    const web3Key = `${chain.replace(' ', '_').toUpperCase()}_WEB3_PROVIDER`;
    this.logger.debug(web3Key);
    const web3Provider = this.configService.get<string>(web3Key);
    this.provider = new ethers.providers.JsonRpcProvider(web3Provider);
  }

  private async sendDAI(receiverAddress: string, amount: string): Promise<string> {
    const wallet = new Wallet(decrypt(this.configService.get<string>('PRIVATE_KEY') as string), this.provider);
    const tx = {
      to: receiverAddress,
      // Convert currency unit from ether to wei
      value: ethers.utils.parseEther(amount),
    };

    const txObj = await wallet.sendTransaction(tx);
    return txObj.hash;
  }

  private async checkResetPeriod(request: RequestToken, ipAddress: string): Promise<void> {
    const dbUser = await this.userRepository
      .createQueryBuilder('user')
      .where('ipAddress = :ia', { ia: ipAddress })
      .orWhere('lastNetwork = :ln', { ln: request.network })
      .getOne();

    if (dbUser != null) {
      const addresses = dbUser.resetWalletAddresses;
      const lastResetDate = +dbUser.lastResetDate;
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      const now = new Date().getTime();

      if (lastResetDate + thirtyDays <= now) {
        dbUser.lastResetDate = now.toString();
        dbUser.resetWalletAddresses = [];
        this.userRepository.save(dbUser);
      } else {
        const max = Number(this.configService.get('RESET_LIMIT'));
        if (addresses.length >= max) {
          throw Error(`You have reached the ${this.configService.get('RESET_PERIOD')} days limit.`);
        }
      }
    }
  }

  private async canRequestToken(request: RequestToken, ipAddress: string): Promise<boolean> {    
    let dbUser = await this.userRepository
      .createQueryBuilder('user')
      .where('ipAddress = :ia', { ia: ipAddress })
      .andWhere('lastNetwork = :ln', { ln: request.network })
      .getOne();

    if (!dbUser) {
      dbUser = await this.userRepository
        .createQueryBuilder('user')
        .andWhere('upper(lastWalletAddress) = :wa', { wa: request.walletAddress.toUpperCase() })
        .andWhere('lastNetwork = :ln', { ln: request.network })
        .getOne();
    }

    if (dbUser) {
      const expiry = Number(dbUser.expiry);
      const now = new Date().getTime();

      if (expiry > now) {
        throw Error('User has already requested a token, You can request again by: ' + new Date(expiry).toString());
      }
    } else {
      dbUser = {
        expiry: '',
        ipAddress: '',
        networks: [],
        walletAddresses: [],
        lastWalletAddress: '',
        lastNetwork: 'Gnosis Chain',
        lastResetDate: Date.now().toString(),
        resetWalletAddresses: [],
      };
    }

    let waitTime;

    if (request.network === 'Gnosis Chain') {
      waitTime = this.configService.get<number>('GNOSIS_WAIT_TIME_MILLI') as number;
    } else if (request.network === 'Chiado Testnet') {
      waitTime = this.configService.get<number>('CHIADO_WAIT_TIME_MILLI') as number;
    } else if (request.network === 'Optimism on Gnosis Chain') {
      waitTime = this.configService.get<number>('OPTIMISM_WAIT_TIME_MILLI') as number;
    }

    const expiry = new Date().getTime() + +waitTime;

    dbUser = {
      id: dbUser.id,
      expiry: expiry.toString(),
      ipAddress: ipAddress,
      networks: [...dbUser.networks, request.network],
      walletAddresses: [...dbUser.walletAddresses, request.walletAddress],
      lastWalletAddress: request.walletAddress,
      lastNetwork: request.network,
      lastResetDate: dbUser.lastResetDate,
      resetWalletAddresses: [...dbUser.resetWalletAddresses, request.walletAddress],
    };

    this.userRepository.save(dbUser);

    return true;
  }

  async parseTweet(id: string): Promise<string> {
    const appOnlyClient = new TwitterApi(process.env.BEARER_TOKEN as string);

    const data = await appOnlyClient.readOnly.v2.singleTweet(id);
    return data.data.text;
  }

  async requestToken(request: RequestToken, ipAddress: string): Promise<string> {
    let amount = this.configService.get<string>('LOWER_AMOUNT') as string;

    // TODO: check tweetUrl here
    if (request.network === 'Gnosis Chain') {
      if (request.tweetUrl.length > 0) {
        // get the tweet amount from the tweet url
        const urlRegex = /https:\/\/twitter.com\/\w+\/status\/(\d+)/g;
        const urlMatches = urlRegex.exec(request.tweetUrl);
        if (urlMatches !== null) {
          const id = urlMatches[1];
          const tweet = await this.parseTweet(id);
          const tweetRegex = /Requesting (0.0\d+)/;
          const tweetMatches = tweetRegex.exec(tweet);
          if (tweetMatches) {
            amount = tweetMatches[1];
            if (amount !== request.amount) {
              throw Error('Amount in tweet does not match amount in request');
            }
          }
        }
      }
    } else if (request.network === 'Chiado Testnet') {
      amount = this.configService.get<string>('CHIADO_AMOUNT') as string;
    } else if (request.network === 'Optimism on Gnosis Chain') {
      amount = this.configService.get<string>('OPTIMISM_AMOUNT') as string;
    }

    await this.checkResetPeriod(request, ipAddress);
    const crt = await this.canRequestToken(request, ipAddress);
    if (crt) {
      this.logger.debug(
        'Sending Amount: '.concat(amount).concat(' to address ').concat(request.walletAddress).concat(' on ').concat(request.network),
      );

      this.connectWeb3(request.network);

      const hash = await this.sendDAI(request.walletAddress, amount);
      return hash;
    }
    return '';
  }
}
