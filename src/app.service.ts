import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RequestToken } from './dtos';
import { ethers, Wallet } from 'ethers';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { decrypt } from './utiils';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  private provider: ethers.providers.JsonRpcProvider;

  @InjectRepository(UserEntity) userRepository: Repository<UserEntity>;

  constructor(private configService: ConfigService) {
    this.logger.debug('AppService Loaded');
  }

  private async connectWeb3(chain: string) {
    const web3Key = `${chain.replace(' ', '_').toUpperCase()}_WEB3_PROVIDER`;

    const web3Provider = this.configService.get<string>(web3Key);
    this.provider = new ethers.providers.JsonRpcProvider(web3Provider);
  }

  private async sendDAI(receiverAddress: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const wallet = new Wallet(decrypt(this.configService.get<string>('PRIVATE_KEY')), this.provider);
        const amount = this.configService.get<string>('GNOSIS_CHAIN_AMOUNT');
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
          dbUser = await this.userRepository.createQueryBuilder('user').where('walletAddress = :wa', { wa: request.walletAddress }).getOne();
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
          };
        }

        const expiry = new Date().getTime() + +this.configService.get<number>('WAIT_TIME_MILLI');

        dbUser = {
          expiry: expiry.toString(),
          ipAddress: ipAddress,
          networks: [...dbUser.networks, request.network],
          walletAddresses: [...dbUser.walletAddresses, request.walletAddress],
        };
        this.userRepository.save(dbUser);

        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  }

  async requestToken(request: RequestToken, ipAddress: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const crt = await this.canRequestToken(request, ipAddress);
        if (crt) {
          this.connectWeb3(request.network);

          switch (request.network) {
            case 'Gnosis Chain':
              const hash = await this.sendDAI(request.walletAddress);
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
