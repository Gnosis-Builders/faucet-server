import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RequestToken } from '../utils/dtos';
import { ethers, Wallet } from 'ethers';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { getManager, Repository } from 'typeorm';
import { decrypt, verifyABI } from 'src/utils/common';
import TwitterApi from 'twitter-api-v2';
import { ERC20ABI, GNOSIS, NETWORKS } from 'src/utils/constants';
import { Blacklisted } from 'src/entities/blacklist.entity';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  private provider: ethers.providers.JsonRpcProvider;

  @InjectRepository(UserEntity) userRepository: Repository<UserEntity>;
  @InjectRepository(Blacklisted) blacklistedRepository: Repository<Blacklisted>;

  constructor(private configService: ConfigService) {
    this.logger.debug('AppService Loaded');
  }

  private async connectWeb3(chain: string) {
    const web3Provider = NETWORKS[chain].web3Provider;
    this.provider = new ethers.providers.JsonRpcProvider(web3Provider);
  }

  private async sendToken(receiverAddress: string, amount: number, network: string): Promise<string> {
    const wallet = new Wallet(decrypt(this.configService.get<string>('PRIVATE_KEY') as string), this.provider);
    const contract = new ethers.Contract(NETWORKS[network].contractAddress, ERC20ABI, wallet);
    const txObj = await contract.transfer(receiverAddress, ethers.utils.parseUnits(amount + ''));
    const tx = await txObj.wait();
    this.logger.log(tx.transactionHash);
    return tx.transactionHash;
  }

  private async sendDAI(receiverAddress: string, amount: number): Promise<string> {
    const wallet = new Wallet(decrypt(this.configService.get<string>('PRIVATE_KEY') as string), this.provider);
    const tx = {
      to: receiverAddress,
      // Convert currency unit from ether to wei
      value: ethers.utils.parseEther(amount + ''),
    };

    const txObj = await wallet.sendTransaction(tx);
    return txObj.hash;
  }

  private async checkBalance(request: RequestToken): Promise<void> {
    const walletAddress = request.walletAddress;
    this.connectWeb3(request.network);

    const balanceOf = await this.provider.getBalance(walletAddress);
    const pointOneEther = ethers.utils.parseEther(NETWORKS[request.network].lowerAmount.toString());
    const oneCentEther = ethers.utils.parseEther(NETWORKS[request.network].smartContractAmount.toString());

    if (+request.amount >= NETWORKS[request.network].smartContractAmount) {
      if (balanceOf.gte(oneCentEther)) {
        throw Error(`Faucet requests are only available to addresses with less than ${NETWORKS[request.network].smartContractAmount} xDAI balance.`);
      }
    } else if (balanceOf.gte(pointOneEther)) {
      throw Error(`Faucet requests are only available to addresses with less than ${NETWORKS[request.network].lowerAmount} xDAI balance.`);
    }
  }

  private async checkResetPeriod(request: RequestToken, ipAddress: string): Promise<void> {
    const dbUser = await this.userRepository
      .createQueryBuilder('user')
      .where('ipAddress = :ia', { ia: ipAddress })
      .orWhere('lastNetwork = :ln', { ln: request.network })
      .getOne();

    if (dbUser != null) {
      const addresses = dbUser.resetWalletAddresses;
      const lastResetDate = Number.isNaN(dbUser.lastResetDate) ? 0 : Number(dbUser.lastResetDate);
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
        throw Error('You have already requested a token, You can request again by: ' + new Date(expiry).toString());
      }

      if (dbUser.isBlacklisted) {
        // fail silently
        this.logger.debug('Blacklisted user tried to request token: ' + request.walletAddress + ' : ' + ipAddress);
        return false;
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
        smartContractABI: '',
        isBlacklisted: false,
      };
    }

    const waitTime = NETWORKS[request.network].waitTime;

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
      smartContractABI: request.smartContractABI,
      isBlacklisted: dbUser.isBlacklisted,
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
    let amount = NETWORKS[request.network].lowerAmount;

    if (+request.amount >= NETWORKS[request.network].smartContractAmount) {
      verifyABI(request.smartContractABI);
      amount = NETWORKS[request.network].smartContractAmount;
    }

    if (request.network === GNOSIS) {
      if (request.tweetUrl.length > 0) {
        // get the tweet amount from the tweet url
        const urlRegex = /https:\/\/twitter.com\/\w+\/status\/(\d+)/g;
        const urlMatches = urlRegex.exec(request.tweetUrl);
        if (urlMatches !== null) {
          const id = urlMatches[1];
          const tweet = await this.parseTweet(id);
          this.logger.debug(tweet);
          let tweetRegex = /Requesting (0.0\d+)/;
          let tweetMatches = tweetRegex.exec(tweet);
          if (tweetMatches) {
            amount = Number(tweetMatches[1]);
            if (amount !== +request.amount) {
              throw Error('Amount in tweet does not match amount in request');
            }
          }

          tweetRegex = /By @gnosisbuilders/;
          tweetMatches = tweetRegex.exec(tweet);
          if (tweetMatches === null) {
            throw Error('Invalid Tweet URL');
          }
        }
      }
    }

    await this.checkResetPeriod(request, ipAddress);

    await this.checkBalance(request);

    const crt = await this.canRequestToken(request, ipAddress);
    if (crt) {
      this.logger.debug(`Sending Amount: ${amount} to address ${request.walletAddress} on ${request.network}`);

      this.connectWeb3(request.network);
      let hash;
      if (NETWORKS[request.network].isNative) {
        hash = await this.sendDAI(request.walletAddress, amount);
      } else {
        hash = await this.sendToken(request.walletAddress, amount, request.network);
      }
      return hash;
    } else {
      // fail silently
      return request.walletAddress;
    }
  }

  async runBlacklistCheck(): Promise<Array<Blacklisted>> {
    const entityManager = getManager();

    const toBlacklist = (await entityManager.query(`
    SELECT * FROM user u 
    WHERE LENGTH(u.walletAddresses) - LENGTH(REPLACE(u.walletAddresses, ',', '')) > ${this.configService.get<number>('MAX_REQUESTS_BEFORE_BLACKLIST')}
    AND u.isBlacklisted = false
  `)) as unknown as Array<UserEntity>;

    this.logger.debug(toBlacklist);

    if (toBlacklist.length > 0) {
      const blacklistedList = toBlacklist.map((tb) => {
        const blacklisted: Blacklisted = {
          blacklistedDate: Date.now(),
          ipAddress: tb.ipAddress,
          walletAddress: tb.lastWalletAddress,
        };

        return blacklisted;
      });

      this.blacklistedRepository.createQueryBuilder('blacklisted').insert().into(Blacklisted).values(blacklistedList).execute();

      blacklistedList.forEach((bl) => {
        // update user repo
        this.userRepository
          .createQueryBuilder('user')
          .update()
          .set({ isBlacklisted: true })
          .where('ipAddress = :ip', { ip: bl.ipAddress })
          .orWhere('lastWalletAddress = :lwa', { lwa: bl.walletAddress })
          .execute();
      });
      return blacklistedList;
    }

    return [];
  }
}
