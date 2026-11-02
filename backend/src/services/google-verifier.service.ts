import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

// Asks Google "is this ID token real, and was it made for my app?"
// Kept in its own class so tests can replace it with a fake.
@Injectable()
export class GoogleVerifier {
  private client: OAuth2Client;
  private clientId: string;

  constructor(config: ConfigService) {
    this.clientId = config.get<string>('GOOGLE_CLIENT_ID') ?? '';
    this.client = new OAuth2Client(this.clientId);
  }

  async verify(idToken: string): Promise<GoogleProfile> {
    try {
      const ticket = await this.client.verifyIdToken({ idToken, audience: this.clientId });
      const p = ticket.getPayload();
      if (!p || !p.email || !p.sub) throw new Error('No email in token');
      return {
        sub: p.sub,
        email: p.email,
        emailVerified: !!p.email_verified,
        name: p.name,
        picture: p.picture,
      };
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }
  }
}
