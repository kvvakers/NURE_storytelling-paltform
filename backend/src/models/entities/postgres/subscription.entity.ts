import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('subscriptions')
@Unique(['followerId', 'followingId'])
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  /** Хто підписується */
  @Column()
  followerId: number;

  /** На кого підписується */
  @Column()
  followingId: number;

  @CreateDateColumn()
  createdAt: Date;
}
