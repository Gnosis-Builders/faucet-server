import { Module } from '@nestjs/common';
import { AppController } from './controllers/app.controller';
import { AppService } from './services/app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserEntity } from './entities/user.entity';
import { TwitterController } from './controllers/twitter.controller';
import { TwitterService } from './services/twitter.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), TypeOrmModule.forRoot(), TypeOrmModule.forFeature([UserEntity])],
  controllers: [AppController, TwitterController],
  providers: [AppService, TwitterService],
})
export class AppModule {}
