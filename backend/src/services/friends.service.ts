import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friendship } from '../models/friendship-entity';
import { User } from '../models/user.entity';

// Only these fields are ever shown to other students.
const publicUser = (u: User) => ({
  id: u.id,
  name: u.name,
  department: u.department,
  avatarUrl: u.avatarUrl,
  bio: u.bio,
});

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friendship) private readonly repo: Repository<Friendship>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async sendRequest(meId: string, receiverId: string) {
    if (meId === receiverId) throw new BadRequestException('You cannot add yourself');
    const receiver = await this.users.findOneBy({ id: receiverId });
    if (!receiver) throw new NotFoundException('User not found');

    const existing = await this.repo.findOne({
      where: [
        { requester: { id: meId }, receiver: { id: receiverId } },
        { requester: { id: receiverId }, receiver: { id: meId } },
      ],
    });
    if (existing && existing.status !== 'declined') {
      throw new ConflictException('Request or friendship already exists');
    }
    if (existing) await this.repo.remove(existing); // allow a new request after a decline

    const saved = await this.repo.save(
      this.repo.create({ requester: { id: meId }, receiver: { id: receiverId } }),
    );
    return { id: saved.id, status: saved.status };
  }

  async respond(meId: string, id: string, accept: boolean) {
    const f = await this.repo.findOne({ where: { id, receiver: { id: meId }, status: 'pending' } });
    if (!f) throw new NotFoundException('Pending request not found');
    f.status = accept ? 'accepted' : 'declined';
    await this.repo.save(f);
    return { id: f.id, status: f.status };
  }

  async cancel(meId: string, id: string) {
    const f = await this.repo.findOne({ where: { id, requester: { id: meId }, status: 'pending' } });
    if (!f) throw new NotFoundException('Pending request not found');
    await this.repo.remove(f);
  }

  async unfriend(meId: string, id: string) {
    const f = await this.repo.findOne({
      where: [
        { id, requester: { id: meId }, status: 'accepted' },
        { id, receiver: { id: meId }, status: 'accepted' },
      ],
    });
    if (!f) throw new NotFoundException('Friendship not found');
    await this.repo.remove(f);
  }

  async list(meId: string) {
    const rows = await this.repo.find({
      where: [
        { requester: { id: meId }, status: 'accepted' },
        { receiver: { id: meId }, status: 'accepted' },
      ],
      relations: { requester: true, receiver: true },
    });
    return rows.map((f) => ({
      friendshipId: f.id,
      user: publicUser(f.requester.id === meId ? f.receiver : f.requester),
    }));
  }

  async incoming(meId: string) {
    const rows = await this.repo.find({
      where: { receiver: { id: meId }, status: 'pending' },
      relations: { requester: true },
    });
    return rows.map((f) => ({ requestId: f.id, createdAt: f.createdAt, user: publicUser(f.requester) }));
  }

  async outgoing(meId: string) {
    const rows = await this.repo.find({
      where: { requester: { id: meId }, status: 'pending' },
      relations: { receiver: true },
    });
    return rows.map((f) => ({ requestId: f.id, createdAt: f.createdAt, user: publicUser(f.receiver) }));
  }
}