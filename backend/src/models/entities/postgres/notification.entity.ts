import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  /** ID користувача, якому адресоване повідомлення (автору глави) */
  @Column()
  userId: number;

  @Column({ default: 'comment' })
  type: string;

  @Column('text')
  message: string;

  @Column({ type: 'int', nullable: true })
  storyId?: number;

  @Column({ type: 'int', nullable: true })
  chapterIndex?: number;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
