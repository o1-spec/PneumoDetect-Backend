import { Module, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Notifications Module
 * 
 * Provides notification management functionality:
 * - Fetch user notifications (GET /notifications)
 * - Mark notifications as read (PATCH /notifications/:id/read)
 * - Create notifications (POST /notifications)
 * - Delete notifications (DELETE /notifications/:id)
 * - Mark all as read (POST /notifications/mark-all-read)
 * 
 * Imports:
 * - PrismaModule: For database access
 * 
 * Providers:
 * - NotificationsService: Business logic for notifications
 * 
 * Controllers:
 * - NotificationsController: API endpoints
 * 
 * Exports:
 * - NotificationsService: For internal use by other modules (e.g., Scans module)
 */
@Module({
  imports: [PrismaModule],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
