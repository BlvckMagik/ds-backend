/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { ChatService } from './chat.service';
import { TelegramService } from '../telegram/telegram.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly telegramService: TelegramService,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
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

  @Get('get-unique-chats')
  async getUniqueChats() {
    try {
      const uniqueChats = await this.messageModel.aggregate([
        {
          $sort: { createdAt: -1 }, // Сортуємо за часом створення (останні повідомлення першими)
        },
        {
          $group: {
            _id: '$userId',
            lastMessage: { $first: '$$ROOT' },
          },
        },
        {
          $replaceRoot: { newRoot: '$lastMessage' },
        },
      ]);

      return uniqueChats;
    } catch (error) {
      console.error('Помилка при отриманні чатів:', error);
      throw error;
    }
  }

  @Get(':userId')
  async getUserMessages(@Param('userId') userId: string) {
    try {
      const messages = await this.messageModel
        .find({ userId: Number(userId) })
        .sort({ createdAt: -1 })
        .exec();

      return messages;
    } catch (error) {
      console.error(
        `Помилка при отриманні повідомлень користувача ${userId}:`,
        error,
      );
      throw error;
    }
  }
}
