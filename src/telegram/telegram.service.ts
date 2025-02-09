/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Multer } from 'multer';

@Injectable()
export class TelegramService {
  private readonly botId = process.env.APPLIES_TELEGRAM_BOT_ID;
  private readonly chatId = process.env.TELEGRAM_CHAT_ID;

  async sendMessage(message: string) {
    const url = `https://api.telegram.org/bot${this.botId}/sendMessage`;

    const payload = {
      chat_id: this.chatId,
      text: message,
      parse_mode: 'HTML',
    };

    const response = await axios.post(url, payload);
    if (response.status !== 200) {
      throw new Error('Помилка при відправці повідомлення в Telegram');
    }
  }
  async sendDocument(file: Multer.File) {
    const url = `https://api.telegram.org/bot${this.botId}/sendDocument`;

    const formData = new FormData();
    if (!this.chatId) {
      throw new Error('Telegram chat ID is not defined');
    }
    formData.append('chat_id', this.chatId);
    const blob = new Blob([file.buffer], { type: file.mimetype });
    formData.append('document', blob, file.originalname);

    const response = await axios.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.status !== 200) {
      throw new Error('Помилка при відправці документа в Telegram');
    }
  }
}
