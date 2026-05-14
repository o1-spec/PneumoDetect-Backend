import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthResponseDto } from '../dto/auth-response.dto';

@Injectable()
export class TokenBuilder {
  constructor(private readonly jwtService: JwtService) {}

  generateToken(userId: string, email: string, role: string): string {
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

  buildAuthResponse(user: any, accessToken: string): AuthResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      specialization: user.specialization,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      isVerified: user.isVerified,
      onboardingCompleted: user.onboardingCompleted,
      createdAt: user.createdAt,
      accessToken,
    };
  }
}
