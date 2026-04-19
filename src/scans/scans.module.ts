import { Module, forwardRef } from '@nestjs/common';
import { ScansService } from './scans.service';
import { ScansController } from './scans.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    PrismaModule,
    CloudinaryModule,
    forwardRef(() => NotificationsModule),
  ],
  providers: [ScansService],
  controllers: [ScansController],
  exports: [ScansService],
})
export class ScansModule {}
