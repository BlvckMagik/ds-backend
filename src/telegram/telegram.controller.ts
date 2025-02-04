import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { SendMessageDto } from './send-message.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';

const telegramHeaders = {
  student: 'Новий запис на урок:',
  teacher: 'Новий відгук на вакансію:',
};

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('send-message')
  @UseInterceptors(FileInterceptor('document'))
  async sendMessage(
    @Body() body: SendMessageDto,
    @UploadedFile() file?: Multer.File,
  ) {
    const { type, name, number, subject, description } = body;

    if (!type || !name || !number || !subject) {
      throw new HttpException(
        'Будь ласка, заповніть всі поля',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Перевірка номеру телефону
    const ukrainianPhoneRegex =
      /^\+?380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/;

    if (!ukrainianPhoneRegex.test(number)) {
      throw new HttpException(
        'Будь ласка, введіть коректний номер телефону у форматі +380 XX XXX XX XX',
        HttpStatus.BAD_REQUEST,
      );
    }

    const message = `
      <b>${telegramHeaders[type]}</b>
  - Ім'я: ${name}
  - Телефон: ${number}
  - Предмет: ${subject}
  - Додаткова інформація: ${description || 'не вказано'}
    `;

    try {
      // Відправка повідомлення
      await this.telegramService.sendMessage(message);

      // Якщо файл є, відправляємо його
      if (file) {
        await this.telegramService.sendDocument(file);
      }

      return { status: 'success' };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new HttpException(
        'Помилка при відправці повідомлення або документа',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
