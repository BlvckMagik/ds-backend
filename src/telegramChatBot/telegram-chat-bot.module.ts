import { Module } from '@nestjs/common';
import { TelegramChatBotService } from './telegramChatBot.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule],
  providers: [TelegramChatBotService],
  exports: [TelegramChatBotService],
})
export class TelegramChatBotModule {}
