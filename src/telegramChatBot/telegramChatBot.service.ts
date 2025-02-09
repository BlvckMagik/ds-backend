/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class TelegramChatBotService implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf;
  private isRunning = false;

  constructor(private readonly chatService: ChatService) {
    const token = process.env.MANAGER_TELEGRAM_BOT_ID;
    if (!token) {
      throw new Error('MANAGER_TELEGRAM_BOT_ID is not defined');
    }
    this.bot = new Telegraf(token);
  }

  async onModuleInit() {
    if (this.isRunning) {
      return;
    }

    try {
      // Налаштування обробників
      this.setupHandlers();

      // Запуск бота з веб-хуком для Render
      const webhookDomain = process.env.WEBHOOK_DOMAIN;
      if (webhookDomain) {
        const webhookUrl = `${webhookDomain}/webhook`;
        await this.bot.telegram.setWebhook(webhookUrl);
        console.log(`Webhook set to ${webhookUrl}`);
      } else {
        // Якщо немає домену для вебхука, використовуємо polling
        await this.bot.launch({
          dropPendingUpdates: true,
          allowedUpdates: ['message', 'callback_query'],
        });
        console.log('Bot started in polling mode');
      }

      this.isRunning = true;

      // Обробники завершення роботи
      process.once('SIGINT', () => this.stop('SIGINT'));
      process.once('SIGTERM', () => this.stop('SIGTERM'));
    } catch (error) {
      console.error('Failed to initialize bot:', error);
      throw error;
    }
  }

  private setupHandlers() {
    this.bot.start(async (ctx) => {
      const userId = ctx.from.id;
      try {
        await ctx.reply(
          'Ласкаво просимо! Зачекайте, будь ласка, поки я підготуюсь до розмови...',
        );
        const response = await this.chatService.getChatResponse(
          userId,
          'Початковий промпт...',
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
  }

  private async stop(signal: string) {
    if (this.isRunning) {
      console.log(`Stopping bot on ${signal}`);
      await this.bot.stop(signal);
      this.isRunning = false;
    }
  }

  async onModuleDestroy() {
    await this.stop('DESTROY');
  }
}
