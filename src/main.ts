import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(new Logger());
  app.enableCors({
    origin: process.env.ALLOWED_DOMAIN, // Дозволити запити лише з цього домену
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Дозволені HTTP-методи
    allowedHeaders: 'Content-Type, Accept', // Дозволені заголовки
    credentials: true, // Дозволити передачу кук та авторизаційних даних
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
