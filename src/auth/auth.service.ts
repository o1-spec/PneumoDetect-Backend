import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { PasswordHelper } from './helpers/password.helper';
import { OtpHelper } from './helpers/otp.helper';
import { AuthValidator } from './helpers/auth.validator';
import { UserCreator } from './helpers/user.creator';
import { TokenBuilder } from './helpers/token.builder';
import { LoginValidator } from './helpers/login.validator';
import { LoginHistoryTracker } from './helpers/login-history.tracker';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
    private readonly passwordHelper: PasswordHelper,
    private readonly otpHelper: OtpHelper,
    private readonly authValidator: AuthValidator,
    private readonly userCreator: UserCreator,
    private readonly tokenBuilder: TokenBuilder,
    private readonly loginValidator: LoginValidator,
    private readonly loginHistoryTracker: LoginHistoryTracker,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, role } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    this.authValidator.validatePatientFields(role, registerDto);
    this.authValidator.validateClinicianFields(role, registerDto);

    const user = await this.userCreator.createUser(registerDto);

    if (role === Role.PATIENT) {
      await this.userCreator.createPatientProfile(user.id, registerDto);
    }

    const otp = this.otpHelper.generateOtp();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiry: this.otpHelper.getOtpExpiry() },
    });

    await this.mailService.sendOtpEmail(email, otp);

    const accessToken = this.tokenBuilder.generateToken(user.id, user.email, user.role);

    return this.tokenBuilder.buildAuthResponse(user, accessToken);
  }

  async login(loginDto: LoginDto, req?: any): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const user = await this.loginValidator.validateUserExists(email);
    await this.loginValidator.validateUserVerified(user);
    await this.loginValidator.validatePassword(password, user.password);
    this.loginValidator.validateUserActive(user);

    await this.loginHistoryTracker.trackLogin(user.id, req);

    const accessToken = this.tokenBuilder.generateToken(user.id, user.email, user.role);

    return this.tokenBuilder.buildAuthResponse(user, accessToken);
  }

  async getProfile(userId: string): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = this.tokenBuilder.generateToken(user.id, user.email, user.role);

    return this.tokenBuilder.buildAuthResponse(user, accessToken);
  }

  async verifyOtp(email: string, otp: string): Promise<{ message: string; user: AuthResponseDto; accessToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.otp || user.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (!user.otpExpiry || this.otpHelper.isOtpExpired(user.otpExpiry)) {
      throw new BadRequestException('OTP has expired');
    }

    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        otp: null,
        otpExpiry: null,
      },
    });

    const accessToken = this.tokenBuilder.generateToken(updatedUser.id, updatedUser.email, updatedUser.role);
    const authResponse = this.tokenBuilder.buildAuthResponse(updatedUser, accessToken);

    await this.mailService.sendWelcomeEmail(email, updatedUser.name);

    await this.notificationsService.createNotification({
      userId: updatedUser.id,
      title: 'Email Verified',
      message: 'Your email has been successfully verified. Welcome to PneumoDetect!',
      type: 'USER',
    });

    return {
      message: 'Email verified successfully',
      user: authResponse,
      accessToken,
    };
  }

  async resendOtp(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('User is already verified');
    }

    const otp = this.otpHelper.generateOtp();
    const otpExpiry = this.otpHelper.getOtpExpiry();

    await this.prisma.user.update({
      where: { email },
      data: { otp, otpExpiry },
    });

    await this.mailService.sendOtpEmail(email, otp);

    return {
      message: 'OTP sent to email',
    };
  }

  async logout(userId?: string): Promise<{ message: string }> {
    if (userId) {
      await this.loginHistoryTracker.trackLogout(userId);
    }

    return {
      message: 'Logged out successfully',
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<{ message: string }> {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.loginValidator.validatePassword(currentPassword, user.password);

    const hashedPassword = await this.passwordHelper.hash(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    await this.notificationsService.createNotification({
      userId: userId,
      title: 'Password Changed',
      message: 'Your password has been changed successfully. If this was not you, please contact support.',
      type: 'SYSTEM',
    });

    return {
      message: 'Password changed successfully',
    };
  }
}

