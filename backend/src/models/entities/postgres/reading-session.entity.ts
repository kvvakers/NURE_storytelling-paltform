import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('reading_session')
export class ReadingSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  storyId: number;

  @Column({ type: 'int' })
  chapterIndex: number;

  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @Column({ type: 'int' })
  durationSeconds: number;

  @CreateDateColumn()
  createdAt: Date;
}
