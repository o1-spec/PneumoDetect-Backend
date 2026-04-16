import { Module, forwardRef } from '@nestjs/common';
import { ScansService } from './scans.service';
import { ScansController } from './scans.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, forwardRef(() => NotificationsModule)],
  providers: [ScansService],
  controllers: [ScansController],
  exports: [ScansService],
})
export class ScansModule {}
