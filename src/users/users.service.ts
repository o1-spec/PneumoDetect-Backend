import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { RecentActivityDto } from './dto/recent-activity.dto';

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

  async downloadMyData(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        scans: {
          select: {
            id: true,
            imageUrl: true,
            status: true,
            result: true,
            confidence: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        notifications: {
          select: {
            id: true,
            title: true,
            message: true,
            type: true,
            read: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        specialization: user.specialization,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      scans: user.scans,
      notifications: user.notifications,
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(userData, null, 2);
  }

  async deleteAccount(userId: string, deleteAccountDto: DeleteAccountDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(deleteAccountDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    try {
      await this.prisma.scan.deleteMany({
        where: { clinicianId: userId },
      });

      await this.prisma.notification.deleteMany({
        where: { userId },
      });

      await this.prisma.user.delete({
        where: { id: userId },
      });

      return {
        message: 'Your account and all associated data have been permanently deleted.',
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete account: ${error.message}`);
    }
  }

  /**
   * Get recent activity for the current user
   * Combines recent scans, notifications, profile updates, and login history
   */
  async getRecentActivity(userId: string, limit: number = 20): Promise<RecentActivityDto[]> {
    // Fetch user with scans
    const userWithScans = await (this.prisma.user as any).findUnique({
      where: { id: userId },
      include: {
        scans: {
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: {
            patient: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Fetch user with notifications
    const userWithNotifications = await (this.prisma.user as any).findUnique({
      where: { id: userId },
      include: {
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: limit,
        },
      },
    });

    // Fetch user with login history
    const userWithLoginHistory = await (this.prisma.user as any).findUnique({
      where: { id: userId },
      include: {
        loginHistory: {
          orderBy: { loginAt: 'desc' },
          take: limit,
        },
      },
    });

    // Fetch base user
    const baseUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!baseUser) {
      throw new NotFoundException('User not found');
    }

    const activities: RecentActivityDto[] = [];

    // Add scans to activity
    if (userWithScans?.scans) {
      userWithScans.scans.forEach((scan) => {
        activities.push({
          id: scan.id,
          type: 'SCAN',
          title: 'Scan Processed',
          message: `X-ray scan for patient ${scan.patient.name} - Status: ${scan.status}`,
          icon: '🔍',
          timestamp: scan.updatedAt,
          metadata: {
            scanId: scan.id,
            scanResult: scan.result || 'Pending',
            confidence: scan.confidence !== null ? scan.confidence : undefined,
            patientName: scan.patient.name,
          },
        });
      });
    }

    // Add notifications to activity
    if (userWithNotifications?.notifications) {
      userWithNotifications.notifications.forEach((notification) => {
        activities.push({
          id: notification.id,
          type: 'NOTIFICATION',
          title: notification.title,
          message: notification.message,
          icon: '🔔',
          timestamp: notification.createdAt,
          metadata: {
            notificationId: notification.id,
            notificationType: notification.type,
          },
        });
      });
    }

    // Add login history to activity
    if (userWithLoginHistory?.loginHistory) {
      userWithLoginHistory.loginHistory.forEach((login) => {
        const duration = login.logoutAt
          ? Math.round((login.logoutAt.getTime() - login.loginAt.getTime()) / 1000 / 60)
          : null;
        const durationStr = duration ? ` (${duration} min)` : '';
        
        activities.push({
          id: `login-${login.id}`,
          type: 'LOGIN',
          title: 'Login',
          message: `Logged in from ${login.ipAddress || 'Unknown IP'}${durationStr}`,
          icon: '🔐',
          timestamp: login.loginAt,
          metadata: {
            loginId: login.id,
            ipAddress: login.ipAddress,
            userAgent: login.userAgent,
            logoutAt: login.logoutAt,
            sessionDurationMinutes: duration || undefined,
          },
        });
      });
    }

    // Add profile updates (from user updatedAt if different from createdAt)
    if (baseUser.updatedAt > baseUser.createdAt) {
      activities.push({
        id: `${baseUser.id}-profile-update`,
        type: 'PROFILE_UPDATE',
        title: 'Profile Updated',
        message: `Your profile was last updated on ${baseUser.updatedAt.toLocaleDateString()}`,
        icon: '👤',
        timestamp: baseUser.updatedAt,
      });
    }

    // Sort by timestamp descending and limit results
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}
