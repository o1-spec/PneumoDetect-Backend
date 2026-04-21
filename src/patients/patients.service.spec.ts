import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

// ─── Mock factories ───────────────────────────────────────────────────────────

const mockPatient = (overrides: Partial<any> = {}) => ({
  id: 'patient-1',
  idNumber: 'PAT-001',
  name: 'Jane Doe',
  age: 35,
  gender: 'FEMALE',
  userId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const mockUser = (overrides: Partial<any> = {}) => ({
  id: 'user-1',
  email: 'patient@example.com',
  name: 'Jane Doe',
  role: 'PATIENT',
  ...overrides,
});

// ─── Service mocks ────────────────────────────────────────────────────────────

const prismaMock = {
  patient: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

const notificationsServiceMock = {
  createNotification: jest.fn().mockResolvedValue({}),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PatientsService', () => {
  let service: PatientsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NotificationsService, useValue: notificationsServiceMock },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
    jest.clearAllMocks();
  });

  // ── createPatient ─────────────────────────────────────────────────────────

  describe('createPatient', () => {
    it('creates a patient when the idNumber is unique', async () => {
      prismaMock.patient.findUnique.mockResolvedValue(null); // no duplicate
      prismaMock.patient.create.mockResolvedValue(mockPatient());

      const result = await service.createPatient({
        idNumber: 'PAT-001',
        name: 'Jane Doe',
        age: 35,
        gender: 'FEMALE' as any,
      });

      expect(prismaMock.patient.create).toHaveBeenCalled();
      expect(result.name).toBe('Jane Doe');
    });

    it('throws ConflictException when a patient with the same idNumber already exists', async () => {
      prismaMock.patient.findUnique.mockResolvedValue(mockPatient());

      await expect(
        service.createPatient({
          idNumber: 'PAT-001',
          name: 'Duplicate',
          age: 30,
          gender: 'MALE' as any,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException when age is out of range', async () => {
      prismaMock.patient.findUnique.mockResolvedValue(null);

      await expect(
        service.createPatient({
          idNumber: 'PAT-NEW',
          name: 'Invalid Age',
          age: 200,
          gender: 'MALE' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('silently continues if notification creation fails after patient creation', async () => {
      prismaMock.patient.findUnique.mockResolvedValue(null);
      prismaMock.patient.create.mockResolvedValue(mockPatient());
      notificationsServiceMock.createNotification.mockRejectedValueOnce(
        new Error('Notification service down'),
      );

      // Should NOT throw — notification failures are caught
      const result = await service.createPatient({
        idNumber: 'PAT-002',
        name: 'Resilient Patient',
        age: 40,
        gender: 'MALE' as any,
      });

      expect(result.name).toBe('Jane Doe');
    });
  });

  // ── getPatientById ────────────────────────────────────────────────────────

  describe('getPatientById', () => {
    it('returns the patient when found', async () => {
      prismaMock.patient.findUnique.mockResolvedValue(mockPatient());

      const result = await service.getPatientById('patient-1');

      expect(result.id).toBe('patient-1');
    });

    it('throws NotFoundException when patient does not exist', async () => {
      prismaMock.patient.findUnique.mockResolvedValue(null);

      await expect(service.getPatientById('ghost-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── deletePatient ─────────────────────────────────────────────────────────

  describe('deletePatient', () => {
    it('deletes the patient and returns a success message', async () => {
      prismaMock.patient.findUnique.mockResolvedValue(mockPatient());
      prismaMock.patient.delete.mockResolvedValue(mockPatient());

      const result = await service.deletePatient('patient-1');

      expect(prismaMock.patient.delete).toHaveBeenCalledWith({ where: { id: 'patient-1' } });
      expect(result.message).toContain('patient-1');
    });

    it('throws NotFoundException when patient to delete does not exist', async () => {
      prismaMock.patient.findUnique.mockResolvedValue(null);

      await expect(service.deletePatient('ghost-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── linkPatientUser ───────────────────────────────────────────────────────

  describe('linkPatientUser', () => {
    it('successfully links a PATIENT-role user to a patient record', async () => {
      prismaMock.patient.findUnique.mockResolvedValue(mockPatient());
      prismaMock.user.findUnique.mockResolvedValue(mockUser());
      prismaMock.patient.findFirst.mockResolvedValue(null); // not already linked
      prismaMock.patient.update.mockResolvedValue(mockPatient({ userId: 'user-1' }));

      const result = await service.linkPatientUser('patient-1', 'user-1');

      expect(prismaMock.patient.update).toHaveBeenCalledWith({
        where: { id: 'patient-1' },
        data: { userId: 'user-1' },
      });
      expect(notificationsServiceMock.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          type: 'USER',
        }),
      );
    });

    it('throws NotFoundException when the patient record does not exist', async () => {
      prismaMock.patient.findUnique.mockResolvedValue(null);

      await expect(service.linkPatientUser('ghost-patient', 'user-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the user does not exist', async () => {
      prismaMock.patient.findUnique.mockResolvedValue(mockPatient());
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.linkPatientUser('patient-1', 'ghost-user'))
        .rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when the user does not have PATIENT role', async () => {
      prismaMock.patient.findUnique.mockResolvedValue(mockPatient());
      prismaMock.user.findUnique.mockResolvedValue(mockUser({ role: 'CLINICIAN' }));

      await expect(service.linkPatientUser('patient-1', 'user-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when the user is already linked to a different patient', async () => {
      prismaMock.patient.findUnique.mockResolvedValue(mockPatient());
      prismaMock.user.findUnique.mockResolvedValue(mockUser());
      prismaMock.patient.findFirst.mockResolvedValue(
        mockPatient({ id: 'different-patient', userId: 'user-1' }),
      );

      await expect(service.linkPatientUser('patient-1', 'user-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('does not throw if the user is already linked to the SAME patient (idempotent update)', async () => {
      prismaMock.patient.findUnique.mockResolvedValue(mockPatient({ userId: 'user-1' }));
      prismaMock.user.findUnique.mockResolvedValue(mockUser());
      // findFirst returns the same patient (same id), so no conflict
      prismaMock.patient.findFirst.mockResolvedValue(mockPatient({ id: 'patient-1', userId: 'user-1' }));
      prismaMock.patient.update.mockResolvedValue(mockPatient({ userId: 'user-1' }));

      const result = await service.linkPatientUser('patient-1', 'user-1');

      expect(result.id).toBe('patient-1');
    });

    it('silently continues if the "Account Linked" notification fails', async () => {
      prismaMock.patient.findUnique.mockResolvedValue(mockPatient());
      prismaMock.user.findUnique.mockResolvedValue(mockUser());
      prismaMock.patient.findFirst.mockResolvedValue(null);
      prismaMock.patient.update.mockResolvedValue(mockPatient({ userId: 'user-1' }));
      notificationsServiceMock.createNotification.mockRejectedValueOnce(
        new Error('Mail service unavailable'),
      );

      // Should not throw — notification errors are non-fatal
      const result = await service.linkPatientUser('patient-1', 'user-1');
      expect(result.id).toBe('patient-1');
    });
  });
});
