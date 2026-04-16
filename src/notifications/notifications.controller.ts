import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationResponseDto, NotificationsListDto } from './dto/notification-response.dto';

/**
 * Notifications Controller
 * 
 * Endpoints for managing user notifications:
 * - GET /notifications - Fetch all notifications for current user
 * - GET /notifications/:id - Fetch single notification (auth check)
 * - PATCH /notifications/:id/read - Mark as read/unread
 * - POST /notifications - Create notification (admin only)
 * - DELETE /notifications/:id - Delete notification
 * - POST /notifications/mark-all-read - Mark all as read
 * 
 * All endpoints protected with JwtAuthGuard
 * All modifying endpoints check authorization (owner-only for read/delete)
 */
@ApiTags('Notifications')
@ApiBearerAuth('access_token')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /notifications
   * 
   * Fetch all notifications for the current authenticated user
   * - Returns newest notifications first
   * - Includes metadata (count, unreadCount)
   * - No query filters (can be added later for pagination)
   * 
   * @param user - Extracted from JWT via @CurrentUser() decorator
   * @returns NotificationsListDto with data array and counts
   */
  @Get()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    type: NotificationsListDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  async getNotifications(
    @CurrentUser() user: any,
  ): Promise<NotificationsListDto> {
    return this.notificationsService.getNotifications(user.id);
  }

  /**
   * GET /notifications/:id
   * 
   * Fetch a single notification by ID
   * - Returns 404 if notification doesn't exist
   * - Returns 403 Forbidden if not the notification owner
   * 
   * @param notificationId - ID from URL parameter
   * @param user - Extracted from JWT via @CurrentUser() decorator
   * @returns NotificationResponseDto
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get single notification by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Notification ID (UUID)',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - you are not the owner of this notification',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  async getNotificationById(
    @Param('id') notificationId: string,
    @CurrentUser() user: any,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.getNotificationById(notificationId, user.id);
  }

  /**
   * PATCH /notifications/:id/read
   * 
   * Mark a notification as read or unread
   * - Only the notification owner can update
   * - Returns 403 Forbidden if unauthorized
   * - Returns 404 if notification doesn't exist
   * 
   * @param notificationId - ID from URL parameter
   * @param user - Extracted from JWT via @CurrentUser() decorator
   * @param updateDto - { read: boolean }
   * @returns Updated NotificationResponseDto
   */
  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read/unread' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Notification ID (UUID)',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification updated successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - you are not the owner of this notification',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  async markAsRead(
    @Param('id') notificationId: string,
    @Body() updateDto: UpdateNotificationDto,
    @CurrentUser() user: any,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsRead(
      notificationId,
      user.id,
      updateDto,
    );
  }

  /**
   * DELETE /notifications/:id
   * 
   * Delete a notification permanently
   * - Only the notification owner can delete
   * - Returns 403 Forbidden if unauthorized
   * - Returns 404 if notification doesn't exist
   * 
   * @param notificationId - ID from URL parameter
   * @param user - Extracted from JWT via @CurrentUser() decorator
   * @returns Success message
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete notification' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Notification ID (UUID)',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - you are not the owner of this notification',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  async deleteNotification(
    @Param('id') notificationId: string,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    return this.notificationsService.deleteNotification(notificationId, user.id);
  }

  /**
   * POST /notifications/mark-all-read
   * 
   * Mark all notifications as read for current user
   * - Batch operation for convenience
   * - Updates all unread notifications to read: true
   * - Returns count of updated notifications
   * 
   * @param user - Extracted from JWT via @CurrentUser() decorator
   * @returns { updatedCount: number }
   */
  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
    schema: {
      properties: {
        updatedCount: { type: 'number', example: 5 },
      },
    },
  })
  async markAllAsRead(
    @CurrentUser() user: any,
  ): Promise<{ updatedCount: number }> {
    return this.notificationsService.markAllAsRead(user.id);
  }

  /**
   * POST /notifications
   * 
   * Create a new notification (admin/system use)
   * - Used for creating notifications from other modules
   * - Can also be used by admins via API for testing
   * - Validates that target user exists
   * 
   * @param createDto - { title, message, type, userId }
   * @returns Created NotificationResponseDto
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createNotification(
    @Body() createDto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.createNotification(createDto);
  }
}