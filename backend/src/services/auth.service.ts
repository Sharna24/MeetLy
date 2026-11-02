import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '../models/user.entity';
import { GoogleVerifier } from './google-verifier.service';
import { UsersService } from './users.service';

@Injectable()
export class AuthService {
  private studentDomain: string;
  private facultyDomain: string;

  constructor(
    private readonly google: GoogleVerifier,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.studentDomain = (config.get<string>('STUDENT_DOMAIN') ?? 'g.bracu.ac.bd').toLowerCase();
    this.facultyDomain = (config.get<string>('FACULTY_DOMAIN') ?? 'bracu.ac.bd').toLowerCase();
  }

  // Which role does this email get? Returns null if the domain is not allowed.
  roleForEmail(email: string): UserRole | null {
    const domain = email.toLowerCase().split('@')[1];
    if (domain === this.studentDomain) return 'student';
    if (domain === this.facultyDomain) return 'faculty';
    return null;
  }

  // The whole login: verify with Google, check the domain, find or create the user, make a token.
  async loginWithGoogle(idToken: string): Promise<{ user: User; token: string }> {
    const profile = await this.google.verify(idToken);

    if (!profile.emailVerified) {
      throw new UnauthorizedException('Google email is not verified');
    }

    const email = profile.email.toLowerCase();
    const role = this.roleForEmail(email);
    if (!role) {
      throw new ForbiddenException('Please sign in with your BRAC University Google account');
    }

    let user = await this.users.findByEmail(email);
    if (!user) {
      user = await this.users.create({
        email,
        googleId: profile.sub,
        name: profile.name ?? null,
        avatarUrl: profile.picture ?? null,
        role,
        isVerified: role === 'student',
      });
    }

    const token = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return { user, token };
  }
}
