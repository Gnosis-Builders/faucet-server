import { Network } from 'src/utils/dtos';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'user' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column('simple-array')
  walletAddresses: string[];
  // amounts: string[]; TODOfu
  @Column()
  ipAddress: string;
  @Column('simple-array')
  networks: Array<Network>;
  @Column()
  expiry: string;
  @Column()
  twitterToken?: string;
  @Column()
  twitterSecret?: string;
  @Column({ default: '' })
  twitterId?: string;
  @Column({ default: '' })
  lastWalletAddress: string;
}
