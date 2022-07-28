import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RequestToken } from '../dtos';
import { ethers, Wallet } from 'ethers';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { TwitterService } from './twitter.service';
import { decrypt } from 'src/utiils';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  private provider: ethers.providers.JsonRpcProvider;

  @InjectRepository(UserEntity) userRepository: Repository<UserEntity>;

  constructor(private configService: ConfigService, private twitterService: TwitterService) {
    this.logger.debug('AppService Loaded');
  }

  private async connectWeb3(chain: string) {
    const web3Key = `${chain.replace(' ', '_').toUpperCase()}_WEB3_PROVIDER`;

    const web3Provider = this.configService.get<string>(web3Key);
    this.provider = new ethers.providers.JsonRpcProvider(web3Provider);
  }

  private async sendDAI(receiverAddress: string, amount: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const wallet = new Wallet(decrypt(this.configService.get<string>('PRIVATE_KEY')), this.provider);
        const tx = {
          to: receiverAddress,
          // Convert currency unit from ether to wei
          value: ethers.utils.parseEther(amount),
        };

        const txObj = await wallet.sendTransaction(tx);
        resolve(txObj.hash);
      } catch (err) {
        reject(err);
      }
    });
  }

  private async canRequestToken(request: RequestToken, ipAddress): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        let dbUser = await this.userRepository.createQueryBuilder('user').where('ipAddress = :ia', { ia: ipAddress }).getOne();

        if (!dbUser) {
          dbUser = await this.userRepository
            .createQueryBuilder('user')
            .where('upper(lastWalletAddress) = :wa', { wa: request.walletAddress.toUpperCase() })
            .getOne();
        }

        if (dbUser) {
          const expiry = Number(dbUser.expiry);
          const now = new Date().getTime();

          if (expiry > now) {
            reject('You can request again by: ' + new Date(expiry).toString());
            return false;
          }
        } else {
          dbUser = {
            expiry: '',
            ipAddress: '',
            networks: [],
            walletAddresses: [],
            lastWalletAddress: '',
          };
        }

        const expiry = new Date().getTime() + +this.configService.get<number>('WAIT_TIME_MILLI');

        dbUser = {
          id: dbUser.id,
          expiry: expiry.toString(),
          ipAddress: ipAddress,
          networks: [...dbUser.networks, request.network],
          walletAddresses: [...dbUser.walletAddresses, request.walletAddress],
          lastWalletAddress: request.walletAddress,
        };

        this.userRepository.save(dbUser);

        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  }

  async walletBalance() {
    return new Promise(async (resolve, reject) => {
      try {
        this.connectWeb3('Gnosis Chain');
        const wallet = new Wallet(decrypt(this.configService.get<string>('PRIVATE_KEY')), this.provider);
        const balance = await wallet.provider.getBalance(wallet.address);
        resolve(ethers.utils.formatEther(balance));
      } catch (err) {
        reject(err);
      }
    });
  }

  async requestToken(request: RequestToken, ipAddress: string) {
    this.logger.debug(`Request Token: ${request}`);
    return new Promise(async (resolve, reject) => {
      try {
        let amount = this.configService.get<string>('LOWER_AMOUNT');

        const crt = await this.canRequestToken(request, ipAddress);
        if (crt) {
          try {
            if (request.userId !== undefined && request.userId.length > 0) {
              const id = await this.twitterService.post(request.userId, this.configService.get<string>('TWEET_TEXT'));
              if (id !== undefined) {
                amount = this.configService.get<string>('HIGHER_AMOUNT');
              }
            }
          } catch (err) {
            // do nothing really
            // resolve('Can not send tweet');
          }

          this.logger.debug('Sending Amount: '.concat(amount).concat(' to address ').concat(request.walletAddress));

          this.connectWeb3(request.network);

          switch (request.network) {
            case 'Gnosis Chain':
              const hash = await this.sendDAI(request.walletAddress, amount);
              resolve(hash);
            default:
              throw new Error('Unknown chain provided');
              break;
          }
        }
      } catch (err) {
        reject(err);
      }
    });
  }
}
