import { Module } from '@nestjs/common';
import { TelegramChatBotService } from './telegramChatBot.service';
import { TelegramChatBotController } from './telegram-chat-bot.controller';
import { ChatModule } from '../chat/chat.module';
import { Telegraf } from 'telegraf';
import { TelegramModule } from 'src/telegram/telegram.module';

@Module({
  imports: [ChatModule, TelegramModule],
  controllers: [TelegramChatBotController],
  providers: [
    {
      provide: Telegraf,
      useFactory: () => {
        const token = process.env.MANAGER_TELEGRAM_BOT_ID;
        if (!token) {
          throw new Error('MANAGER_TELEGRAM_BOT_ID is not defined');
        }
        return new Telegraf(token);
      },
    },
    TelegramChatBotService,
  ],
})
export class TelegramChatBotModule {}
