/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    try {
      return this.appService.getHealth();
    } catch (error) {
      throw new ServiceUnavailableException('Сервіс недоступний');
    }
  }
}
