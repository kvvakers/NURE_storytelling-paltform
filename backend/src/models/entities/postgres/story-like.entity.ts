import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('story_like')
export class StoryLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  storyId: number;

  @Column({ type: 'int' })
  userId: number;

  @CreateDateColumn()
  createdAt: Date;
}
