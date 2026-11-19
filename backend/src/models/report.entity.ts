import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

export type ReportStatus = 'open' | 'resolved';

// MODEL (M): one row in the "reports" table.
@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Who filed the report
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  reporter: User;

  // Who was reported
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  target: User;

  @Column({ type: 'varchar', default: 'other' })
  category: string;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'varchar', default: 'open' })
  status: ReportStatus;

  @CreateDateColumn()
  createdAt: Date;
}