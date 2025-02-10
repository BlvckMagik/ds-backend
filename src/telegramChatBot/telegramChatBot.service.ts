/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { ChatService } from '../chat/chat.service';
import { TelegramService } from '../telegram/telegram.service';
import { connect, disconnect } from '@ngrok/ngrok';

@Injectable()
export class TelegramChatBotService implements OnModuleInit, OnModuleDestroy {
  // @ts-ignore
  private bot: Telegraf;
  private isRunning = false;
  private ngrokListener: any;

  constructor(
    private readonly chatService: ChatService,
    // @ts-ignore
    @Inject(Telegraf) private readonly bot: Telegraf,
    private readonly telegramService: TelegramService,
  ) {
    this.bot = bot;
  }

  private async setWebhookWithRetry(webhookUrl: string, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.bot.telegram.deleteWebhook({ drop_pending_updates: true });
        // Чекаємо 2 секунди після видалення вебхука
        await new Promise((resolve) => setTimeout(resolve, 2000));

        await this.bot.telegram.setWebhook(webhookUrl);
        console.log(`Webhook встановлено на ${webhookUrl}`);
        return true;
      } catch (error) {
        if (error.response?.error_code === 429) {
          const retryAfter = error.response.parameters.retry_after || 1;
          console.log(
            `Очікування ${retryAfter} секунд перед повторною спробою...`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, retryAfter * 1000),
          );

          if (attempt === maxRetries) {
            throw new Error(
              `Не вдалося встановити webhook після ${maxRetries} спроб`,
            );
          }
          continue;
        }
        throw error;
      }
    }
  }

  async onModuleInit() {
    if (this.isRunning) {
      return;
    }

    try {
      this.setupHandlers();
      let webhookDomain;

      if (process.env.NODE_ENV === 'development') {
        try {
          this.ngrokListener = await connect({
            addr: Number(process.env.PORT) || 3000,
            authtoken: process.env.NGROK_AUTH_TOKEN,
          });
          webhookDomain = this.ngrokListener.url();
          console.log('Створено новий Ngrok тунель:', webhookDomain);
        } catch (error) {
          console.error('Помилка при налаштуванні Ngrok:', error);
          webhookDomain = process.env.WEBHOOK_DOMAIN;
        }
      } else {
        webhookDomain = process.env.WEBHOOK_DOMAIN;
      }

      if (!webhookDomain) {
        throw new Error('Не вдалося отримати домен для вебхука');
      }

      const secretPath = `/webhook/${process.env.MANAGER_TELEGRAM_BOT_ID}`;
      const webhookUrl = `${webhookDomain}${secretPath}`;

      await this.setWebhookWithRetry(webhookUrl);

      // Чекаємо 2 секунди перед запуском бота
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await this.bot.launch({
        webhook: {
          domain: webhookDomain,
          path: secretPath,
          hookPath: secretPath,
        },
      });

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
    // Обробник команди /start
    this.bot.command('start', async (ctx) => {
      const userId = ctx.from.id;
      console.log(`Отримано команду /start від користувача ${userId}`);

      try {
        await ctx.reply(
          'Вітаю! Мені потрібно трошки часу щоб підготуватись, зачекайте, будь ласка.',
        );

        const response = await this.chatService.getChatResponse(
          userId,
          // Після отримання всіх необхідних данних перепитай чи є ще додаткові питання і ввічливо попрощайся
          `
          Ти асистент школи іноземних мов. Тобі потрібно консультувати людей щодо роботи школи.
          Наш графік роботи - з 9 ранку по 21 кожен день крім неділі
          Абонемент на 8 уроків - 2000 грн. Якщо в місяці занять 9, то воно бонусне
          Приймаються діти від 6 років. Дітям, які віком менше шести, ми ввічливо відмовляємо та радимо знайти оффлайн курси, так як це буде більш ефективно для малого віку. 
          Також є можливість навчатись і дорослим. 
          Є підготовка до іспитів, але це треба уточнювати у менеджера 
          Пробний урок безкоштовний, або за добровільний донат на ЗСУ. 
          Рівень визначається тестом або учень вказує самостійно. При консультації потрібно перепитати рівень. 

          Твої задачі: Спочатку привітайся та скажи щось типу: 'Вас вітає асистент репетирорського центру Drako Schule' та запитай: 'Як я можу до Вас звертатись?'. Слово Drako Schule повинно мати гіперпосилання на ${process.env.ALLOWED_DOMAIN}. Після цього запитай які питання цікавлять користувача і дай на них відповідь. Після того як всі питання вирішені тобі потрібно дізнатись у користувача номер телефону, ім'я та вік дитини, який предмет бажає вивчати дитина та рівень володіння мовою. Потрібно надати розгорнуту консультацію та відповідати на питання користувача. Якщо відповідь тобі невідома - проси звернутись до менеджера школи.
          Якщо користувач не хоче оформлювати заявку, то просто проведи консультацію
          Не розписуй одразу увесь текст. Спілкуйся як живий асистент і випитуй по одному питанню. Задавай тільки одне питання за раз.
          Доступні предмети для запису: німецька мова, англійська мова, іспанська мова, математика.
          Рівні володіння мовою: A1, A2, B1, B2, C1, C2.
          Номер телефону має відповідати паттерну українських, німецьких та австрійських номерів. Якщо користувач заявляє, що це телефон іншої країни, то його можна прийняти
          Консультації не по темі розмови не проводяться. Можеш переходити на інші мови крім російської, але якщо починаєш говорити першим, то звертайся українською. Консультація російською не проводиться, на цю мову заборонено переходити.
          Після отримання всіх необхідних данних відправ данні форми, що заповнив користувач і попроси його підтвердити, що все правильно. В самому повідомленні має бути ключова фраза повністю: "Будь ласка, перевірте вказані дані". Після підтвердження подякуй, скажи, що ми зв'яжемося з користувачем найближчим часом і попрощайся. Також скажи, що якщо будуть додаткові питання, то користувач може звертатись повторно.
          Для форматування тексту використовуй parse_mode: 'HTML'. Використовуй тільки його, не використовуй MarkdownV2! Ні в якому разі не проводь консультації не по темі школи!
          `,
        );

        await ctx.reply(response, {
          parse_mode: 'HTML',
        });
      } catch (error) {
        console.error('Помилка в команді /start:', error);
        await ctx.reply('Виникла помилка. Спробуйте ще раз.');
      }
    });

    // Обробник текстових повідомлень
    this.bot.on('text', async (ctx) => {
      const userId = ctx.from.id;
      const userMessage = ctx.message.text;
      console.log(
        `Отримано повідомлення від користувача ${userId}: ${userMessage}`,
      );

      try {
        console.log('Sending request to OpenAI with userId:', userId);
        const response = await this.chatService.getChatResponse(
          userId,
          userMessage,
        );

        // Перевіряємо довжину відповіді
        if (response.length >= 4096) {
          // Якщо повідомлення завелике, розділяємо його на частини
          const parts = response.match(/.{1,4096}/g) || [];
          for (const part of parts) {
            await ctx.reply(part, {
              parse_mode: 'HTML',
            });
          }
        } else {
          // Перевіряємо наявність ключової фрази
          if (response.includes('Будь ласка, перевірте вказані дані')) {
            await this.telegramService.sendMessage(response);
          }

          await ctx.reply(response, {
            parse_mode: 'HTML',
          });
        }
      } catch (error) {
        console.error('Помилка обробки повідомлення:', error);
        await ctx.reply('Виникла помилка. Спробуйте ще раз.');
      }
    });
  }

  private async stop(signal: string) {
    if (this.isRunning) {
      console.log(`Stopping bot on ${signal}`);
      await this.bot.telegram.deleteWebhook();
      await this.bot.stop(signal);
      if (this.ngrokListener) {
        await disconnect(this.ngrokListener);
      }
      this.isRunning = false;
    }
  }

  async onModuleDestroy() {
    await this.stop('DESTROY');
  }
}
