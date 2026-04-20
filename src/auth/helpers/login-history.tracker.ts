import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LoginHistoryTracker {
  constructor(private readonly prisma: PrismaService) {}

  async trackLogin(userId: string, request?: any): Promise<void> {
    if (!request) return;

    const ipAddress = request.ip || request.connection?.remoteAddress || 'UNKNOWN';
    const userAgent = request.headers?.['user-agent'] || 'UNKNOWN';

    try {
      await this.prisma.loginHistory.create({
        data: {
          userId,
          ipAddress,
          userAgent,
          loginAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to track login history:', error);
    }
  }

  async trackLogout(userId: string): Promise<void> {
    try {
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
}
