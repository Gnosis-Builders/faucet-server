import { Network } from 'src/utils/dtos';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'whitelist' })
export class Whitelist {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column()
  ipAddress: string;
  @Column({ default: '' })
  walletAddress: string;
  @Column({ default: 0 })
  dateAdded: number;  
}
