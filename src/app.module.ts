import { Module } from '@nestjs/common';
import { AppController } from './controllers/app.controller';
import { AppService } from './services/app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserEntity } from './entities/user.entity';
import { MailerModule } from '@nestjs-modules/mailer';
import * as dotenv from 'dotenv';
import { RequestAmountService } from "./services/request.amount.service";
import { RequestAmountsEntity } from "./entities/request.amount.entity";
dotenv.config();

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_SERVER,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(),
    TypeOrmModule.forFeature([UserEntity, RequestAmountsEntity]),
  ],
  controllers: [AppController],
  providers: [AppService, RequestAmountService],
})
export class AppModule {}
