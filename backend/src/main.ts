import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: process.env.CLIENT_URL, credentials: true });
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Meetly API running on http://localhost:${port}`);
}
bootstrap();
