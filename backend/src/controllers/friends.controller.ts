import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SendFriendRequestDto } from '../dtos/send-friend-request.dto';
import { FriendsService } from '../services/friends.service';
import { AuthRequest } from '../common/auth-request';

@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friends: FriendsService) {}

  @Get()
  list(@Req() req: AuthRequest) { return this.friends.list(req.user.sub); }

  @Get('requests/incoming')
  incoming(@Req() req: AuthRequest) { return this.friends.incoming(req.user.sub); }

  @Get('requests/outgoing')
  outgoing(@Req() req: AuthRequest) { return this.friends.outgoing(req.user.sub); }

  @Post('requests')
  send(@Req() req: AuthRequest, @Body() dto: SendFriendRequestDto) {
    return this.friends.sendRequest(req.user.sub, dto.receiverId);
  }

  @Patch('requests/:id/accept')
  accept(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.friends.respond(req.user.sub, id, true);
  }

  @Patch('requests/:id/decline')
  decline(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.friends.respond(req.user.sub, id, false);
  }

  @Delete('requests/:id')
  cancel(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.friends.cancel(req.user.sub, id);
  }

  @Delete(':id')
  unfriend(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.friends.unfriend(req.user.sub, id);
  }
}