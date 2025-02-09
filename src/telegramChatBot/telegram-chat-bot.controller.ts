/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { Telegraf } from 'telegraf';

@Controller()
export class TelegramChatBotController {
  constructor(private readonly bot: Telegraf) {}

  @Post('/webhook/:secret')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    try {
      await this.bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } catch (error) {
      console.error('Помилка обробки webhook:', error);
      res.status(500).send('Помилка обробки webhook');
    }
  }
}
