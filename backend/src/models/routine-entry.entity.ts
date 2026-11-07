import {
  Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { Day, EntryType } from '../config/routine.config';
import { User } from './user.entity';

// MODEL (M): one meeting of one class on one day.
// A class that meets on Sunday and Tuesday is stored as TWO rows.
@Entity('routine_entries')
@Index(['userId', 'semester', 'dayOfWeek'])
export class RoutineEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  // Deleting a user deletes their routine too.
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  semester: string; // e.g. "FALL 2026"

  @Column({ type: 'varchar', length: 20 })
  courseCode: string; // e.g. "CSE425"

  @Column({ type: 'varchar', length: 10, nullable: true })
  section: string | null; // e.g. "06"

  @Column({ type: 'varchar', length: 20, nullable: true })
  faculty: string | null; // faculty initial, e.g. "MMM"

  @Column({ type: 'varchar', length: 30, nullable: true })
  room: string | null; // e.g. "09G-31T"

  @Column({ type: 'varchar', default: 'class' })
  type: EntryType;

  @Column({ type: 'varchar', length: 3 })
  dayOfWeek: Day; // "SAT" ... "FRI"

  @Column({ type: 'int' })
  startMin: number; // minutes after midnight

  @Column({ type: 'int' })
  endMin: number;

  @CreateDateColumn()
  createdAt: Date;
}