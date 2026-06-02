import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('co_author_invitations')
export class CoAuthorInvitation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  storyId: number;

  @Column()
  inviterId: number;

  @Column()
  inviteeId: number;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
