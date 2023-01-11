import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'blacklisted' })
export class Blacklisted {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column({unique: true})
  ipAddress: string;
  @Column({unique: true})
  walletAddress: string;
  @Column({ default: 0 })
  blacklistedDate: number;  
}
