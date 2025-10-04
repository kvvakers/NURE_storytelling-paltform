import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class DocumentContent extends Document {
  @Prop({ required: true })
  documentId: number;

  @Prop({ type: Object })
  content: any;

  @Prop({ type: Array, default: [] })
  history: Array<any>;
}

export const DocumentContentSchema =
  SchemaFactory.createForClass(DocumentContent);
