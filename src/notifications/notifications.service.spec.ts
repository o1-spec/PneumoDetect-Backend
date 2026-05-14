import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Shared mock factories ───────────────────────────────────────────────────

const mockUser = (overrides: Partial<any> = {}) => ({
  id: 'user-1',
  email: 'doctor@hospital.com',
  name: 'Dr. Smith',
  role: 'CLINICIAN',
  ...overrides,
});

const mockNotification = (overrides: Partial<any> = {}) => ({
  id: 'notif-1',
  title: 'Test Notification',
  message: 'This is a test message',
  type: 'SCAN',
  isRead: false,
  userId: 'user-1',
  createdAt: new Date('2026-04-21T00:00:00Z'),
  updatedAt: new Date('2026-04-21T00:00:00Z'),
  ...overrides,
});

// ─── Prisma mock ─────────────────────────────────────────────────────────────

const prismaMock = {
  user: {
    findUnique: jest.fn(),
  },
  notification: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
  },
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  // ── getNotifications ──────────────────────────────────────────────────────

  describe('getNotifications', () => {
    it('returns notifications for the given user, newest first', async () => {
      const notifs = [mockNotification(), mockNotification({ id: 'notif-2', isRead: true })];
      prismaMock.notification.findMany.mockResolvedValue(notifs);

      const result = await service.getNotifications('user-1');

      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result.data).toHaveLength(2);
      expect(result.unreadCount).toBe(1);
    });

    it('returns empty list when user has no notifications', async () => {
      prismaMock.notification.findMany.mockResolvedValue([]);

      const result = await service.getNotifications('user-1');

      expect(result.data).toHaveLength(0);
      expect(result.unreadCount).toBe(0);
    });
  });

  // ── getNotificationById ───────────────────────────────────────────────────

  describe('getNotificationById', () => {
    it('returns notification when it belongs to the requesting user', async () => {
      prismaMock.notification.findUnique.mockResolvedValue(mockNotification());

      const result = await service.getNotificationById('notif-1', 'user-1');

      expect(result.id).toBe('notif-1');
    });

    it('throws NotFoundException when notification does not exist', async () => {
      prismaMock.notification.findUnique.mockResolvedValue(null);

      await expect(service.getNotificationById('notif-999', 'user-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when requesting user does not own the notification', async () => {
      prismaMock.notification.findUnique.mockResolvedValue(
        mockNotification({ userId: 'other-user' }),
      );

      await expect(service.getNotificationById('notif-1', 'user-1'))
        .rejects.toThrow(ForbiddenException);
    });
  });

  // ── markAsRead ────────────────────────────────────────────────────────────

  describe('markAsRead', () => {
    it('marks a notification as read when the owner requests it', async () => {
      const updated = mockNotification({ isRead: true });
      prismaMock.notification.findUnique.mockResolvedValue(mockNotification());
      prismaMock.notification.update.mockResolvedValue(updated);

      const result = await service.markAsRead('notif-1', 'user-1', { isRead: true });

      expect(prismaMock.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isRead: true },
      });
      expect(result.isRead).toBe(true);
    });

    it('throws ForbiddenException when a different user tries to mark as read', async () => {
      prismaMock.notification.findUnique.mockResolvedValue(
        mockNotification({ userId: 'other-user' }),
      );

      await expect(service.markAsRead('notif-1', 'user-1', { isRead: true }))
        .rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when notification does not exist', async () => {
      prismaMock.notification.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead('notif-999', 'user-1', { isRead: true }))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── createNotification ────────────────────────────────────────────────────

  describe('createNotification', () => {
    it('creates a notification for a valid user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser());
      prismaMock.notification.create.mockResolvedValue(mockNotification());

      const result = await service.createNotification({
        userId: 'user-1',
        title: 'Scan Results Available',
        message: 'Your scan is ready.',
        type: 'SCAN',
      });

      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: {
          title: 'Scan Results Available',
          message: 'Your scan is ready.',
          type: 'SCAN',
          userId: 'user-1',
          priority: 'NORMAL',
        },
      });
      expect(result.id).toBe('notif-1');
    });

    it('throws BadRequestException when the target user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createNotification({
          userId: 'ghost-user',
          title: 'Hello',
          message: 'World',
          type: 'SYSTEM',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── markAllAsRead ─────────────────────────────────────────────────────────

  describe('markAllAsRead', () => {
    it('marks all unread notifications as read and returns the updated count', async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead('user-1');

      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
        data: { isRead: true },
      });
      expect(result.updatedCount).toBe(5);
    });

    it('returns 0 when there are no unread notifications', async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.markAllAsRead('user-1');

      expect(result.updatedCount).toBe(0);
    });
  });

  // ── deleteNotification ────────────────────────────────────────────────────

  describe('deleteNotification', () => {
    it('deletes a notification owned by the requesting user', async () => {
      prismaMock.notification.findUnique.mockResolvedValue(mockNotification());
      prismaMock.notification.delete.mockResolvedValue(mockNotification());

      const result = await service.deleteNotification('notif-1', 'user-1');

      expect(prismaMock.notification.delete).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
      });
      expect(result.message).toBe('Notification deleted successfully');
    });

    it('throws NotFoundException when notification does not exist', async () => {
      prismaMock.notification.findUnique.mockResolvedValue(null);

      await expect(service.deleteNotification('notif-999', 'user-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when a different user tries to delete', async () => {
      prismaMock.notification.findUnique.mockResolvedValue(
        mockNotification({ userId: 'other-user' }),
      );

      await expect(service.deleteNotification('notif-1', 'user-1'))
        .rejects.toThrow(ForbiddenException);
    });
  });

  // ── createScanCompletionNotification (helper) ─────────────────────────────

  describe('createScanCompletionNotification', () => {
    it('creates a SCAN-type notification for the given doctor', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser());
      prismaMock.notification.create.mockResolvedValue(
        mockNotification({ title: 'Scan Completed', type: 'SCAN' }),
      );

      const result = await service.createScanCompletionNotification(
        'user-1',
        'Jane Doe',
        'PNEUMONIA',
      );

      expect(prismaMock.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'SCAN',
            userId: 'user-1',
          }),
        }),
      );
      expect(result.type).toBe('SCAN');
    });
  });
});
