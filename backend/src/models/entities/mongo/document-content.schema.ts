import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DocumentContentDocument = Document & DocumentContent;

export interface CommentReply {
  id: string;
  text: string;
  authorId: number;
  createdAt: Date;
}

export interface ChapterComment {
  id: string;
  selectedText: string;
  text: string;
  authorId: number;
  createdAt: Date;
  replies: CommentReply[];
}

export interface Chapter {
  title: string;
  content: string;
  comments: ChapterComment[];
}

@Schema({ timestamps: true })
export class DocumentContent extends Document {
  @Prop({ required: true })
  documentId: number;

  @Prop({
    type: [
      {
        title: String,
        content: String,
        comments: {
          type: [
            {
              id: String,
              selectedText: String,
              text: String,
              authorId: Number,
              createdAt: { type: Date, default: Date.now },
              replies: {
                type: [
                  {
                    id: String,
                    text: String,
                    authorId: Number,
                    createdAt: { type: Date, default: Date.now },
                  },
                ],
                default: [],
              },
            },
          ],
          default: [],
        },
      },
    ],
    default: [],
  })
  chapters: Chapter[];

  @Prop({ type: Array, default: [] })
  history: Array<any>;
}

export const DocumentContentSchema =
  SchemaFactory.createForClass(DocumentContent);
