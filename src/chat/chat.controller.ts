import { Controller, Post, Body, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { TelegramService } from '../telegram/telegram.service';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly telegramService: TelegramService,
  ) {}

  @Post('send')
  async sendMessage(
    @Body('prompt') prompt: string,
    @Body('userId') userId: number,
  ): Promise<{ response: string }> {
    try {
      const response = await this.chatService.getChatResponse(userId, prompt);

      // Відправляємо відповідь через телеграм, якщо є userId
      if (userId) {
        await this.telegramService.sendMessage(response);
      }

      return { response };
    } catch (error) {
      console.error('Error in chat controller:', error);
      throw error;
    }
  }

  @Post('continue/:chatId')
  async continueChat(
    @Param('chatId') chatId: string,
    @Body('prompt') prompt: string,
    @Body('userId') userId: number,
  ): Promise<{ response: string }> {
    try {
      const response = await this.chatService.getChatResponse(userId, prompt);

      // Відправляємо відповідь через телеграм, якщо є userId
      if (userId) {
        await this.telegramService.sendMessage(response);
      }

      return { response };
    } catch (error) {
      console.error('Error in chat controller:', error);
      throw error;
    }
  }
}
