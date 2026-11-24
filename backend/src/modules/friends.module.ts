import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friendship } from '../models/friendship-entity';
import { User } from '../models/user.entity';
import { FriendsController } from '../controllers/friends.controller';
import { FriendsService } from '../services/friends.service';

@Module({
  imports: [TypeOrmModule.forFeature([Friendship, User])],
  controllers: [FriendsController],
  providers: [FriendsService],
})
export class FriendsModule {}