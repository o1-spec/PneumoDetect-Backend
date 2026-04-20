import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, name, specialization, phone, role, dateOfBirth, gender, bloodType, medicalHistory } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Validate patient-specific fields if role is PATIENT
    if (role === Role.PATIENT) {
      if (!dateOfBirth || !gender) {
        throw new BadRequestException('dateOfBirth and gender are required for PATIENT role');
      }
    }

    const hashedPassword = await this.hashPassword(password);
    const otp = this.generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        specialization: role === Role.CLINICIAN ? specialization : undefined,
        phone,
        role: role || Role.CLINICIAN,
        otp,
        otpExpiry,
      },
    });

    // Create patient profile if role is PATIENT
    if (role === Role.PATIENT && dateOfBirth && gender) {
      await this.prisma.patientProfile.create({
        data: {
          userId: user.id,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          bloodType,
          medicalHistory,
        },
      });
    }

    await this.mailService.sendOtpEmail(email, otp);

    const accessToken = this.generateToken(user.id, user.email, user.role);

    return this.buildAuthResponse(user, accessToken);
  }

  async login(loginDto: LoginDto, req?: any): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    const isPasswordValid = await this.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Track login history
    if (req) {
      const ipAddress = req.ip || req.connection?.remoteAddress || 'UNKNOWN';
      const userAgent = req.headers?.['user-agent'] || 'UNKNOWN';

      try {
        await this.prisma.loginHistory.create({
          data: {
            userId: user.id,
            ipAddress,
            userAgent,
            loginAt: new Date(),
          },
        });
      } catch (error) {
        console.error('Failed to track login history:', error);
      }
    }

    const accessToken = this.generateToken(user.id, user.email, user.role);

    return this.buildAuthResponse(user, accessToken);
  }

  async getProfile(userId: string): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = this.generateToken(user.id, user.email, user.role);

    return this.buildAuthResponse(user, accessToken);
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

    if (!user.otpExpiry || new Date() > user.otpExpiry) {
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

    const accessToken = this.generateToken(updatedUser.id, updatedUser.email, updatedUser.role);
    const authResponse = this.buildAuthResponse(updatedUser, accessToken);

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

    const otp = this.generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.user.update({
      where: { email },
      data: {
        otp,
        otpExpiry,
      },
    });

    await this.mailService.sendOtpEmail(email, otp);

    return {
      message: 'OTP sent to email',
    };
  }

  async logout(userId?: string): Promise<{ message: string }> {
    if (userId) {
      try {
        // Find the most recent login record without a logout time
        const recentLogin = await this.prisma.loginHistory.findFirst({
          where: {
            userId,
            logoutAt: null,
          },
          orderBy: {
            loginAt: 'desc',
          },
        });

        if (recentLogin) {
          await this.prisma.loginHistory.update({
            where: { id: recentLogin.id },
            data: {
              logoutAt: new Date(),
            },
          });
        }
      } catch (error) {
        console.error('Failed to track logout:', error);
      }
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

    const isPasswordValid = await this.verifyPassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await this.hashPassword(newPassword);

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

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private generateToken(userId: string, email: string, role: string): string {
    const payload = {
      sub: userId,
      email,
      role,
    };

    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '7d',
    });
  }

  private buildAuthResponse(user: any, accessToken: string): AuthResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      specialization: user.specialization,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      createdAt: user.createdAt,
      accessToken,
    };
  }
}
