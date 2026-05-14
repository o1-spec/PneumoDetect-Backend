import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { OnboardingService } from './onboarding.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UsersService, OnboardingService],
  controllers: [UsersController],
  exports: [UsersService, OnboardingService],
})
export class UsersModule {}
