import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DocumentContentDocument = Document & DocumentContent;

@Schema({ timestamps: true })
export class DocumentContent extends Document {
  @Prop({ required: true })
  documentId: number;

  @Prop({ type: [{ title: String, content: String }], default: [] })
  chapters: Array<{ title: string; content: string }>;

  @Prop({ type: Array, default: [] })
  history: Array<any>;
}

export const DocumentContentSchema =
  SchemaFactory.createForClass(DocumentContent);
