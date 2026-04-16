import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get the current user's profile (via JWT)
   */
  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        specialization: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return new UserResponseDto(user);
  }

  /**
   * Update the current user's profile
   */
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<UserResponseDto> {
    // Verify user exists
    const userExists = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      throw new NotFoundException('User not found');
    }

    // Update user profile
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(updateProfileDto.name && { name: updateProfileDto.name }),
        ...(updateProfileDto.specialization && { specialization: updateProfileDto.specialization }),
        ...(updateProfileDto.phone && { phone: updateProfileDto.phone }),
        ...(updateProfileDto.avatarUrl && { avatarUrl: updateProfileDto.avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        specialization: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return new UserResponseDto(updatedUser);
  }
}
