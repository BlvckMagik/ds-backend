/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class HealthService implements OnModuleInit {
  private readonly logger = new Logger(HealthService.name);
  private readonly interval = 12 * 60 * 1000; // 12 хвилин
  private readonly url = process.env.APP_URL;

  async onModuleInit() {
    if (!this.url) {
      this.logger.error('APP_URL не налаштовано в змінних оточення');
      return;
    }
    this.startHealthCheck();
  }

  private startHealthCheck() {
    setInterval(async () => {
      try {
        const startTime = Date.now();
        await axios.get(`${this.url}/health`);
        const duration = Date.now() - startTime;

        this.logger.log(`Health check успішний. Тривалість: ${duration}ms`);
      } catch (error) {
        this.logger.error(`Помилка health check: ${error.message}`);
      }
    }, this.interval);
  }
}
