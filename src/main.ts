import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExceptionsFilter } from "./exception.filter";


async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'log', 'verbose'],
  });
  app.enableCors();
  app.setGlobalPrefix('/api');
  app.useGlobalFilters(new ExceptionsFilter());
  await app.listen(process.env.PORT);
}
bootstrap();
