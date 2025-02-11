import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({
  timestamps: true,
  collection: 'GPT-chats',
})
export class Message {
  @Prop({ required: true, index: true })
  userId: number;

  @Prop({ required: true })
  userMessage: string;

  @Prop({ required: true })
  botResponse: string;

  @Prop({ index: true })
  username?: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
