import {
  Body, Controller, Get, HttpCode, Post, Req, Res, UnauthorizedException, UseGuards,
} from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../services/users.service';

class GoogleLoginDto {
  @IsString()
  @IsNotEmpty()
  credential: string; // the ID token Google gives the browser
}

const COOKIE_NAME = 'token';
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

// CONTROLLER (C): receives requests, calls the service, sends the response.
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly users: UsersService) {}

  @Post('google')
  @HttpCode(200)
  async google(@Body() body: GoogleLoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.auth.loginWithGoogle(body.credential);
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true, // JavaScript in the browser cannot read it
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SEVEN_DAYS,
    });
    return user;
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    const user = await this.users.findById(req.user.sub);
    if (!user) throw new UnauthorizedException('User no longer exists');
    return user;
  }
}
