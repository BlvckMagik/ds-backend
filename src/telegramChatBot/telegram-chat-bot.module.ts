import { Module } from '@nestjs/common';
import { TelegramChatBotService } from './telegramChatBot.service';
import { TelegramChatBotController } from './telegram-chat-bot.controller';
import { ChatModule } from '../chat/chat.module';
import { Telegraf } from 'telegraf';
import { TelegramModule } from 'src/telegram/telegram.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from '../chat/schemas/message.schema';

@Module({
  imports: [
    ChatModule,
    TelegramModule,
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
  ],
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
