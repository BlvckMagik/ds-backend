import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramModule } from './telegram/telegram.module';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { ChatModule } from './chat/chat.module';
import { TelegramChatBotModule } from './telegramChatBot/telegram-chat-bot.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MulterModule.register({
      dest: './uploads',
    }),
    TelegramModule,
    TelegramChatBotModule,
    ChatModule, // Додаємо ChatModule до імпортів
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
