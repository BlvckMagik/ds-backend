// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai'; // Імпортуємо OpenAI з нової версії бібліотеки

@Injectable()
export class ChatService {
  private openai: OpenAI;
  private userChatHistory: Map<
    number,
    Array<{ role: 'user' | 'assistant'; content: string }>
  > = new Map(); // Зберігає історію діалогів для кожного користувача

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // Додайте ваш API ключ у змінні оточення
    });
  }

  async getChatResponse(userId: number, prompt: string): Promise<string> {
    try {
      const userHistory = this.userChatHistory.get(userId) || [];

      const messages = [
        ...userHistory,
        { role: 'user' as const, content: prompt },
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 5000,
        temperature: 0.7,
      });

      const chatResponse = response.choices[0]?.message?.content?.trim() || '';

      // Оновлюємо історію діалогу
      if (chatResponse) {
        userHistory.push(
          { role: 'user', content: prompt },
          { role: 'assistant', content: chatResponse },
        );
        this.userChatHistory.set(userId, userHistory);
      }

      return chatResponse;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw new Error('Failed to get response from OpenAI');
    }
  }
}
