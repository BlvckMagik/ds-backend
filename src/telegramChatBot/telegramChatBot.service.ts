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
      this.setupHandlers();

      const webhookDomain = process.env.WEBHOOK_DOMAIN;
      const secretPath = `/webhook/${process.env.MANAGER_TELEGRAM_BOT_ID}`;

      if (webhookDomain) {
        // Додаємо затримку перед видаленням вебхука
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Видаляємо попередній вебхук
        await this.bot.telegram.deleteWebhook({ drop_pending_updates: true });

        // Додаємо затримку перед встановленням нового вебхука
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Встановлюємо новий webhook
        await this.bot.telegram.setWebhook(`${webhookDomain}${secretPath}`);
        console.log(`Webhook встановлено на ${webhookDomain}${secretPath}`);

        // Додаємо затримку перед запуском
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Запускаємо бота
        await this.bot.launch({
          webhook: {
            domain: webhookDomain,
            path: secretPath,
            hookPath: secretPath,
          },
        });
      } else {
        throw new Error('WEBHOOK_DOMAIN не налаштовано в змінних оточення');
      }

      this.isRunning = true;
      console.log('Telegram bot started successfully in webhook mode');

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
          `
          Ти асистент школи іноземних мов. Тобі потрібно консультувати людей щодо роботи школи.
          Наш графік роботи - з 9 ранку по 21 кожен день крім неділі
          Абонемент на 8 уроків - 2000 грн.
          Приймаються діти від 6 до 12 років. Також є можливість навчатись і дорослим
          Пробний урок безкоштовний
          Рівень визначається тестом або учень вказує самостійно. При консультації потрібно перепитати рівень.
          Можеш переходити на інші мови, але якщо починаєш говорити першим, то звертайся українською. Консультація російською не проводиться, на цю мову заборонено переходити.

          Твої задачі: Тобі потрібно дізнатись у користувача номер телефону, ім'я вік дитини, рівень володіння мовою. Потрібно надати розгорнуту консультацію та відповідати на питання користувача. Якщо відповідь тобі невідома - проси звернутись до менеджера школи.
          Після отримання всіх необхідних данних перепитай чи є ще додаткові питання і ввічливо попрощайся
          Не розписуй одразу увесь текст. Спілкуйся як живий асистент і випитуй по одному питанню
          Консультації не по темі розмови не проводяться. Номер телефону обов'язково має відповідати паттерну українських номерів. Якщо користувач заявляє, що це телефон іншої країни, то його можна прийняти
          `,
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
      try {
        const userId = ctx.from.id;
        const userMessage = ctx.message.text;

        console.log(
          `Отримано повідомлення від користувача ${userId}: ${userMessage}`,
        );

        const response = await this.chatService.getChatResponse(
          userId,
          userMessage,
        );

        console.log(`Відповідь для користувача ${userId}: ${response}`);

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
      await this.bot.telegram.deleteWebhook();
      await this.bot.stop(signal);
      this.isRunning = false;
    }
  }

  async onModuleDestroy() {
    await this.stop('DESTROY');
  }
}
