import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationResponseDto, NotificationsListDto } from './dto/notification-response.dto';
import { NotificationType } from '@prisma/client';

/**
 * Notifications Service
 * 
 * Handles all notification-related business logic:
 * - Fetching notifications for a user (newest first)
 * - Marking notifications as read
 * - Creating new notifications (internal use)
 * - Authorization checks (only notification owner can read/update)
 */
@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all notifications for the current user
   * - Filters by userId
   * - Orders by newest first (createdAt DESC)
   * - Returns complete list with metadata (count, unreadCount)
   * 
   * @param userId - ID of the authenticated user
   * @returns NotificationsListDto with data array and metadata
   */
  async getNotifications(userId: string): Promise<NotificationsListDto> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return new NotificationsListDto(notifications);
  }

  /**
   * Get a single notification by ID with authorization check
   * - Verifies notification exists
   * - Ensures requesting user is the owner
   * - Throws ForbiddenException if unauthorized
   * 
   * @param notificationId - ID of notification to fetch
   * @param userId - ID of requesting user
   * @returns NotificationResponseDto if authorized
   * @throws NotFoundException if notification doesn't exist
   * @throws ForbiddenException if user is not the owner
   */
  async getNotificationById(
    notificationId: string,
    userId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(
        `Notification with ID ${notificationId} not found`,
      );
    }

    // Authorization: only the notification owner can view it
    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this notification',
      );
    }

    return new NotificationResponseDto(notification);
  }

  /**
   * Mark a notification as read or unread
   * - Verifies notification exists
   * - Ensures requesting user is the owner
   * - Updates the read field
   * 
   * @param notificationId - ID of notification to update
   * @param userId - ID of requesting user
   * @param updateDto - Contains new read status
   * @returns Updated NotificationResponseDto
   * @throws NotFoundException if notification doesn't exist
   * @throws ForbiddenException if user is not the owner
   */
  async markAsRead(
    notificationId: string,
    userId: string,
    updateDto: UpdateNotificationDto,
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(
        `Notification with ID ${notificationId} not found`,
      );
    }

    // Authorization: only the notification owner can update it
    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this notification',
      );
    }

    const updatedNotification = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: updateDto.read },
    });

    return new NotificationResponseDto(updatedNotification);
  }

  /**
   * Create a new notification (internal use only)
   * - Called by other modules (e.g., Scans) when events occur
   * - Can be called by admins via API endpoint
   * - Validates user exists before creating
   * 
   * @param createDto - Notification data (title, message, type, userId)
   * @returns Created NotificationResponseDto
   * @throws BadRequestException if user doesn't exist
   */
  async createNotification(
    createDto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    // Verify the user exists
    const user = await this.prisma.user.findUnique({
      where: { id: createDto.userId },
    });

    if (!user) {
      throw new BadRequestException(`User with ID ${createDto.userId} not found`);
    }

    const notification = await this.prisma.notification.create({
      data: {
        title: createDto.title,
        message: createDto.message,
        type: createDto.type,
        userId: createDto.userId,
      },
    });

    return new NotificationResponseDto(notification);
  }

  /**
   * Internal method: Create a scan completion notification
   * - Called by ScansService after scan is processed successfully
   * - Creates SCAN type notification for the doctor
   * - Message includes patient name and scan result
   * 
   * @param doctorId - ID of the doctor who performed the scan
   * @param patientName - Name of the patient
   * @param scanResult - Result of the scan (PNEUMONIA or NORMAL)
   * @returns Created NotificationResponseDto
   */
  async createScanCompletionNotification(
    doctorId: string,
    patientName: string,
    scanResult: string,
  ): Promise<NotificationResponseDto> {
    const dto = new CreateNotificationDto();
    dto.title = 'Scan Completed';
    dto.message = `Scan result ready for ${patientName}: ${scanResult}`;
    dto.type = 'SCAN' as NotificationType;
    dto.userId = doctorId;
    return this.createNotification(dto);
  }

  /**
   * Internal method: Create a system notification
   * - Called for general system messages
   * - Visible to specified user
   * 
   * @param userId - ID of recipient user
   * @param title - Notification title
   * @param message - Notification message
   * @returns Created NotificationResponseDto
   */
  async createSystemNotification(
    userId: string,
    title: string,
    message: string,
  ): Promise<NotificationResponseDto> {
    const dto = new CreateNotificationDto();
    dto.title = title;
    dto.message = message;
    dto.type = 'SYSTEM' as NotificationType;
    dto.userId = userId;
    return this.createNotification(dto);
  }

  /**
   * Mark all notifications as read for a user
   * - Batch update operation
   * - Useful for "mark all as read" feature
   * 
   * @param userId - ID of the user
   * @returns Number of notifications updated
   */
  async markAllAsRead(userId: string): Promise<{ updatedCount: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return { updatedCount: result.count };
  }

  /**
   * Delete a notification
   * - Only the notification owner can delete
   * - Soft delete would be better in production (add deletedAt field)
   * - For now, we're using hard delete
   * 
   * @param notificationId - ID of notification to delete
   * @param userId - ID of requesting user
   * @throws NotFoundException if notification doesn't exist
   * @throws ForbiddenException if user is not the owner
   */
  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(
        `Notification with ID ${notificationId} not found`,
      );
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this notification',
      );
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return { message: 'Notification deleted successfully' };
  }
}
