/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class TelegramChatBotService implements OnModuleInit {
  private bot: Telegraf;

  constructor(private readonly chatService: ChatService) {
    const token = process.env.MANAGER_TELEGRAM_BOT_ID;
    if (!token) {
      throw new Error('MANAGER_TELEGRAM_BOT_ID is not defined');
    }
    this.bot = new Telegraf(token);
  }

  async onModuleInit() {
    try {
      this.bot.start(async (ctx) => {
        const userId = ctx.from.id;
        try {
          await ctx.reply(
            'Ласкаво просимо! Зачекайте, будь ласка, поки я підготуюсь до розмови...',
          );

          const response = await this.chatService.getChatResponse(
            userId,
            `Ти асистент школи іноземних мов...`, // Ваш початковий промпт
          );

          await ctx.reply(response);
        } catch (error) {
          console.error('Error in start command:', error);
          await ctx.reply(
            'Виникла помилка при ініціалізації чату. Спробуйте ще раз.',
          );
        }
      });

      this.bot.on('text', async (ctx) => {
        const userId = ctx.from.id;
        const userMessage = ctx.message.text;

        try {
          const response = await this.chatService.getChatResponse(
            userId,
            userMessage,
          );
          await ctx.reply(response);
        } catch (error) {
          console.error('Error processing message:', error);
          await ctx.reply('Виникла помилка. Спробуйте ще раз.');
        }
      });
      //@ts-ignore
      await this.bot.launch({
        dropPendingUpdates: true,
        allowed_updates: ['message', 'callback_query'],
      });

      console.log('Telegram bot started successfully');

      process.once('SIGINT', () => this.bot.stop('SIGINT'));
      process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    } catch (error) {
      console.error('Failed to initialize bot:', error);
      throw error;
    }
  }
}
