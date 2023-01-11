import { Module } from '@nestjs/common';
import { AppController } from './controllers/app.controller';
import { AppService } from './services/app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserEntity } from './entities/user.entity';
import { Blacklisted } from "./entities/blacklist.entity";
import { Whitelist } from "./entities/whitelist.entity";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), TypeOrmModule.forRoot(), TypeOrmModule.forFeature([UserEntity, Blacklisted, Whitelist])],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
