import { Notification, NotificationType, NotificationPriority } from '@prisma/client';

/**
 * Response DTO for a single notification
 * Returned from endpoints that fetch or modify notifications
 */
export class NotificationResponseDto {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;

  constructor(notification: Notification) {
    this.id = notification.id;
    this.title = notification.title;
    this.message = notification.message;
    this.type = notification.type;
    this.priority = notification.priority;
    this.isRead = notification.isRead;
    this.createdAt = notification.createdAt;
    this.updatedAt = notification.updatedAt;
    this.userId = notification.userId;
  }
}

/**
 * List response DTO for all notifications of a user
 */
export class NotificationsListDto {
  data: NotificationResponseDto[];
  count: number;
  unreadCount: number;

  constructor(notifications: Notification[]) {
    this.data = notifications.map(n => new NotificationResponseDto(n));
    this.count = notifications.length;
    this.unreadCount = notifications.filter(n => !n.isRead).length;
  }
}
