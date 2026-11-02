import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Runs before a protected route: reads the login cookie and checks it is valid.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const token = req.cookies?.token;
    if (!token) throw new UnauthorizedException('Not logged in');
    try {
      req.user = await this.jwt.verifyAsync(token); // { sub, role }
    } catch {
      throw new UnauthorizedException('Login expired');
    }
    return true;
  }
}
