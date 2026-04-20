import { Injectable } from '@nestjs/common';

@Injectable()
export class UserMapper {
  toUserResponseDto(user: any) {
    const { password, otp, otpExpiry, ...rest } = user;
    return rest;
  }

  toPublicUserDto(user: any) {
    return {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
    };
  }

  toUserWithProfileDto(user: any, profile?: any) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      createdAt: user.createdAt,
      profile: profile || null,
    };
  }
}
