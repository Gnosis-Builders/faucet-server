import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'request_amounts' })
export class RequestAmountsEntity {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column({ default: '' })
  ipAddress: string;
  @Column({ default: '' })
  walletAddress: string;
  @Column({ default: 0 })
  cumulativeAmount: number;
  @Column({default: false})
  alertSent: boolean;
  @Column()
  alertDate: number;
}
