import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type UserRole = 'student' | 'faculty' | 'admin';

// MODEL (M): one row in the "users" table.
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  googleId: string | null;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'varchar', default: 'student' })
  role: UserRole;

  // Students are verified automatically; faculty wait for an admin to verify them.
  @Column({ default: true })
  isVerified: boolean;

  @Column({ type: 'varchar', nullable: true })
  department: string | null;

  // Student ID for students, faculty initial for faculty.
  @Column({ type: 'varchar', nullable: true })
  studentId: string | null;

  @Column({ type: 'varchar', length: 280, nullable: true })
  bio: string | null;

  @Column({ default: false })
  profileComplete: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
