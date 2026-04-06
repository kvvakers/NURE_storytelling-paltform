import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('documents')
export class DocumentMeta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  author?: string;

  @Column({ nullable: true })
  characters?: string;

  @Column('text', { array: true, default: [] })
  genres: string[];

  @Column('text', { array: true, default: [] })
  tags: string[];

  @Column()
  language: string;

  @Column()
  cover: string;

  @Column({ type: 'int', default: 0 })
  rating: number;

  @Column({ type: 'int', nullable: true })
  ownerId?: number;

  @CreateDateColumn()
  createdAt: Date;
}
