import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from './user.entity';

export type FriendStatus = 'pending' | 'accepted' | 'declined';

@Entity('friendships')
@Unique(['requester', 'receiver'])
export class Friendship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  requester: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  receiver: User;

  @Column({ type: 'varchar', default: 'pending' })
  status: FriendStatus;

  @CreateDateColumn()
  createdAt: Date;
}