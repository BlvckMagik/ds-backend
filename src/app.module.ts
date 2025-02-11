/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramModule } from './telegram/telegram.module';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { ChatModule } from './chat/chat.module';
import { TelegramChatBotModule } from './telegramChatBot/telegram-chat-bot.module';
import { HealthModule } from './health/health.module';
import { MongooseModule } from '@nestjs/mongoose';
import { mongodbConfig } from './config/mongodb.config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI || '', {
      retryAttempts: 5,
      retryDelay: 3000,
      // @ts-ignore
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'DS-DB',
    }),
    MulterModule.register({
      dest: './uploads',
    }),
    TelegramModule,
    TelegramChatBotModule,
    ChatModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  onModuleInit() {
    mongodbConfig.setup();
  }
}
