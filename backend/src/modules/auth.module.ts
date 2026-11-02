import { Module } from '@nestjs/common';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { GoogleVerifier } from '../services/google-verifier.service';
import { UsersModule } from './users.module';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, GoogleVerifier],
})
export class AuthModule {}
