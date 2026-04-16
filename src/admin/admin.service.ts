import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all users (admin only)
   */
  async getAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => new UserResponseDto(user));
  }

  /**
   * Update user status (activate/deactivate)
   */
  async updateUserStatus(userId: string, updateUserStatusDto: UpdateUserStatusDto): Promise<UserResponseDto> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent admin from deactivating themselves
    // This would require passing the admin's ID to this method
    // For now, we'll just update the status

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: updateUserStatusDto.isActive,
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

  /**
   * Delete a user (admin only)
   */
  async deleteUser(userId: string): Promise<{ message: string }> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete user and their related data (cascade delete via Prisma schema)
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User deleted successfully' };
  }

  /**
   * Get a single user by ID (admin only)
   */
  async getUserById(userId: string): Promise<UserResponseDto> {
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
}
