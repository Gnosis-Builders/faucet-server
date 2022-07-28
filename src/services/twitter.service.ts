import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { Response, ResponseUtils } from 'src/utiils';
import { TwitterApi } from 'twitter-api-v2';
import { Repository } from 'typeorm';

@Injectable()
export class TwitterService {
  private readonly logger = new Logger(TwitterService.name);

  @InjectRepository(UserEntity) userRepository: Repository<UserEntity>;

  constructor(private configService: ConfigService) {
    this.logger.debug('TwitterService Loaded');
  }

  async login(ipAddress: string, walletAddress: string) {
    const appKey = this.configService.get<string>('CONSUMER_KEY');
    const appSecret = this.configService.get<string>('CONSUMER_SECRET');
    const callback = this.configService.get<string>('CALLBACK_URL');
    const v1Client = new TwitterApi({ appKey, appSecret });
    const authLink = await v1Client.generateAuthLink(callback);
    const { oauth_token, oauth_token_secret } = authLink;

    let dbUser = await this.userRepository.createQueryBuilder('user').where('ipAddress = :ia', { ia: ipAddress }).getOne();

    if (!dbUser) {
      dbUser = await this.userRepository
        .createQueryBuilder('user')
        .where('upper(lastWalletAddress) = :wa', { wa: walletAddress.toUpperCase() })
        .getOne();
    }

    if (!dbUser) {
      // create one
      dbUser = {
        expiry: '',
        ipAddress,
        networks: [],
        twitterSecret: oauth_token_secret,
        twitterToken: oauth_token,
        walletAddresses: [walletAddress],
        lastWalletAddress: walletAddress,
      };
    } else {
      dbUser = {
        ...dbUser,
        twitterSecret: oauth_token_secret,
        twitterToken: oauth_token,
        walletAddresses: [...dbUser.walletAddresses, walletAddress],
        lastWalletAddress: walletAddress,
      };
    }

    await this.userRepository.save(dbUser);

    return authLink;
  }

  async callback(token: string, verifier: string): Promise<Response> {
    try {
      const dbUser = await this.userRepository.createQueryBuilder('user').where('twitterToken = :tt', { tt: token }).getOne();
      if (!dbUser) {
        throw new Error('User token not found');
      }

      const secret = dbUser.twitterSecret;

      if (!token || !verifier || !secret) {
        throw new Error('You denied the app or your session expired!');
      } else {
        const appKey = this.configService.get<string>('CONSUMER_KEY');
        const appSecret = this.configService.get<string>('CONSUMER_SECRET');

        const v1Client = new TwitterApi({
          appKey,
          appSecret,
          accessToken: token,
          accessSecret: secret,
        });

        const response = await v1Client.login(verifier);
        const { userId, accessToken, accessSecret } = response;

        dbUser.twitterToken = accessToken;
        dbUser.twitterSecret = accessSecret;
        dbUser.twitterId = userId;

        await this.userRepository.save(dbUser);

        const frontend = this.configService.get<string>('FRONTEND_URL');

        return ResponseUtils.getSuccessResponse(`${frontend}?user=${userId}&walletAddress=${dbUser.lastWalletAddress}`);
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async post(userId: string, status: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const v1 = await this.getV1Client(userId);
        const response = await v1.tweet(status);
        resolve(response.id.toString());
      } catch (err) {
        reject(err);
      }
    });
  }

  private getV1Client = async (userId) => {
    const dbUser = await this.userRepository.createQueryBuilder('user').where('twitterId = :ti', { ti: userId }).getOne();

    if (!dbUser) {
      throw new Error('User is not previously authenticated');
    }

    const { twitterToken: accessToken, twitterSecret: accessSecret } = dbUser;

    const appKey = this.configService.get<string>('CONSUMER_KEY');
    const appSecret = this.configService.get<string>('CONSUMER_SECRET');

    const v1Client = new TwitterApi({
      appKey,
      appSecret,
      accessToken: accessToken,
      accessSecret: accessSecret,
    });

    return v1Client.v1;
  };
}
