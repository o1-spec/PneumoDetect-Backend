import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PasswordHelper } from './helpers/password.helper';
import { OtpHelper } from './helpers/otp.helper';
import { AuthValidator } from './helpers/auth.validator';
import { UserCreator } from './helpers/user.creator';
import { TokenBuilder } from './helpers/token.builder';
import { LoginValidator } from './helpers/login.validator';
import { LoginHistoryTracker } from './helpers/login-history.tracker';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    NotificationsModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    PasswordHelper,
    OtpHelper,
    AuthValidator,
    UserCreator,
    TokenBuilder,
    LoginValidator,
    LoginHistoryTracker,
  ],
  exports: [AuthService],
})
export class AuthModule {}
