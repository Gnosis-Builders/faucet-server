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
  @Column({ default: '' })
  lastWalletAddress: string;
  @Column({ default: '' })
  lastNetwork: Network;
  @Column({ default: '' })
  lastResetDate: string;
  @Column({ type: 'simple-array', default: '' })
  resetWalletAddresses: string[];
  @Column({ default: '' })
  smartContractABI: string;  
}
