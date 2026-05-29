import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('library_item')
export class LibraryItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  storyId: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int', nullable: true })
  categoryId: number | null;

  @Column({ type: 'int', nullable: true })
  bookmarkChapterIndex: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
