/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { Logger } from '@nestjs/common';
import mongoose from 'mongoose';

export const mongodbConfig = {
  setup: () => {
    const logger = new Logger('MongoDB');

    mongoose.connection.on('connected', () => {
      logger.log('MongoDB успішно підключено');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`Помилка підключення до MongoDB: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB відключено');
    });

    mongoose.connection.on('reconnected', () => {
      logger.log('MongoDB перепідключено');
    });

    mongoose.connection.on('reconnectFailed', () => {
      logger.error('Не вдалося перепідключитися до MongoDB');
    });

    // Логування операцій
    if (process.env.NODE_ENV === 'development') {
      mongoose.set(
        'debug',
        (collectionName: string, method: string, ...args: any[]) => {
          logger.debug(`${collectionName}.${method}(${JSON.stringify(args)})`);
        },
      );
    }

    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.log("MongoDB з'єднання закрито через завершення програми");
        process.exit(0);
      } catch (err) {
        logger.error("Помилка при закритті з'єднання з MongoDB:", err);
        process.exit(1);
      }
    });
  },
};
