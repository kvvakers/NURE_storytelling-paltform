import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('story_rating')
@Unique(['storyId', 'userId'])
export class StoryRating {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  storyId: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int' })
  rating: number;

  @CreateDateColumn()
  createdAt: Date;
}
