import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Более мягкая валидация
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: false, // Отключаем whitelist
    forbidNonWhitelisted: false, // Отключаем запрет невалидных полей
  }));

  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap();