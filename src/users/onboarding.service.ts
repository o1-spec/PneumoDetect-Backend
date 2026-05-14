import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(private prisma: PrismaService) {}

  async completeOnboarding(userId: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: { onboardingCompleted: true },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          onboardingCompleted: true,
          createdAt: true,
        },
      });

      this.logger.log(`Onboarding completed for user ${userId}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to complete onboarding: ${error.message}`);
      throw new BadRequestException(
        `Failed to complete onboarding: ${error.message}`,
      );
    }
  }

  async getOnboardingStatus(userId: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          onboardingCompleted: true,
          isVerified: true,
          isActive: true,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      return user;
    } catch (error) {
      this.logger.error(
        `Failed to get onboarding status: ${error.message}`,
      );
      throw new BadRequestException(
        `Failed to get onboarding status: ${error.message}`,
      );
    }
  }

  async skipOnboarding(userId: string): Promise<any> {
    try {
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: { onboardingCompleted: false },
        select: {
          id: true,
          email: true,
          onboardingCompleted: true,
        },
      });

      this.logger.log(`Onboarding skipped for user ${userId}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to skip onboarding: ${error.message}`);
      throw new BadRequestException(
        `Failed to skip onboarding: ${error.message}`,
      );
    }
  }
}
