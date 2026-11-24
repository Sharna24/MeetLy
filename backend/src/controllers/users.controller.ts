import { BadRequestException, Body, Controller, Delete, Get, Patch, Query, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { UsersService } from '../services/users.service';
import type { AuthRequest } from '../common/auth-request';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(@Req() req: any, @Body() dto: UpdateProfileDto) {
    const user = await this.users.updateProfile(req.user.sub, dto);
    if (!user) throw new UnauthorizedException('User no longer exists');
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteMe(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    const deleted = await this.users.deleteProfile(req.user.sub);
    if (!deleted) throw new UnauthorizedException('User no longer exists');
    res.clearCookie('token');
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  search(@Req() req: AuthRequest, @Query('q') q = '') {
    const term = q.trim();
    if (term.length < 2) throw new BadRequestException('Search term is too short');
    return this.users.search(req.user.sub, term);
  }
}
