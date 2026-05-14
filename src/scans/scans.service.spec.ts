import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ScansService } from './scans.service';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AiService } from '../ai/ai.service';

// ─── Mock factories ───────────────────────────────────────────────────────────

const mockPatient = (overrides: Partial<any> = {}) => ({
  id: 'patient-1',
  idNumber: 'PAT-001',
  name: 'Jane Doe',
  age: 35,
  gender: 'FEMALE',
  userId: null,
  ...overrides,
});

const mockClinician = (overrides: Partial<any> = {}) => ({
  id: 'clinician-1',
  name: 'Dr. Smith',
  email: 'dr.smith@hospital.com',
  role: 'CLINICIAN',
  ...overrides,
});

const mockScan = (overrides: Partial<any> = {}) => ({
  id: 'scan-1',
  imageUrl: 'https://res.cloudinary.com/test/image.jpg',
  heatmapUrl: null,
  status: 'PROCESSING',
  result: null,
  confidence: null,
  modelVersion: null,
  clinicianId: 'clinician-1',
  patientId: 'patient-1',
  isSharedWithPatient: true,
  clinicianNotes: null,
  patientNotes: null,
  analyzedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  patient: mockPatient(),
  clinician: mockClinician(),
  ...overrides,
});

// ─── Service mocks ────────────────────────────────────────────────────────────

const prismaMock = {
  patient: { findUnique: jest.fn() },
  patientProfile: { findUnique: jest.fn() },
  scan: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

const cloudinaryMock = {
  uploadImage: jest.fn().mockResolvedValue({ secure_url: 'https://res.cloudinary.com/test/image.jpg' }),
};

const notificationsMock = {
  createNotification: jest.fn().mockResolvedValue({}),
};

const aiMock = {
  predictPneumonia: jest.fn().mockResolvedValue({
    result: 'NORMAL',
    confidence: 0.95,
    rawPrediction: 0.05,
  }),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ScansService', () => {
  let service: ScansService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScansService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CloudinaryService, useValue: cloudinaryMock },
        { provide: NotificationsService, useValue: notificationsMock },
        { provide: AiService, useValue: aiMock },
      ],
    }).compile();

    service = module.get<ScansService>(ScansService);
    jest.clearAllMocks();
  });

  // ── createScan ────────────────────────────────────────────────────────────

  describe('createScan', () => {
    it('uploads scan and notifies the clinician on success', async () => {
      prismaMock.patient.findUnique.mockResolvedValue(mockPatient());
      prismaMock.scan.create.mockResolvedValue(mockScan());

      const result = await service.createScan(
        { patientId: 'patient-1' },
        Buffer.from('fake-image'),
        'xray.jpg',
        'clinician-1',
      );

      expect(cloudinaryMock.uploadImage).toHaveBeenCalled();
      expect(prismaMock.scan.create).toHaveBeenCalled();
      expect(notificationsMock.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'clinician-1',
          type: 'SCAN',
        }),
      );
      expect(result.id).toBe('scan-1');
    });

    it('throws NotFoundException when the patient does not exist', async () => {
      prismaMock.patient.findUnique.mockResolvedValue(null);

      await expect(
        service.createScan({ patientId: 'ghost' }, Buffer.from('x'), 'x.jpg', 'clinician-1'),
      ).rejects.toThrow(NotFoundException);

      expect(cloudinaryMock.uploadImage).not.toHaveBeenCalled();
    });
  });

  // ── processScan ───────────────────────────────────────────────────────────

  describe('processScan', () => {
    it('processes a scan and notifies the owning clinician', async () => {
      const completedScan = mockScan({
        status: 'COMPLETED',
        result: 'NORMAL',
        confidence: 0.95,
        analyzedAt: new Date(),
      });

      prismaMock.scan.findUnique.mockResolvedValue(mockScan());
      prismaMock.scan.update.mockResolvedValue(completedScan);

      const result = await service.processScan(
        'scan-1',
        'clinician-1',
        'CLINICIAN',
        {},
      );

      expect(prismaMock.scan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'scan-1' },
          data: expect.objectContaining({ status: 'COMPLETED' }),
        }),
      );
      // At least the clinician gets a notification
      expect(notificationsMock.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'clinician-1' }),
      );
      expect(result.id).toBe('scan-1');
    });

    it('also sends a patient notification when isSharedWithPatient is true and patient has userId', async () => {
      const patientWithUser = mockPatient({ userId: 'patient-user-1' });
      const completedScan = mockScan({
        status: 'COMPLETED',
        result: 'PNEUMONIA',
        confidence: 0.92,
        isSharedWithPatient: true,
        patient: patientWithUser,
      });

      prismaMock.scan.findUnique.mockResolvedValue(mockScan({ patient: patientWithUser }));
      prismaMock.scan.update.mockResolvedValue(completedScan);

      await service.processScan('scan-1', 'clinician-1', 'CLINICIAN', {});

      // Should send notification to both clinician and patient user
      const calls = notificationsMock.createNotification.mock.calls;
      const patientNotif = calls.find((c) => c[0].userId === 'patient-user-1');
      expect(patientNotif).toBeDefined();
      expect(patientNotif[0].type).toBe('SCAN');
    });

    it('does NOT send patient notification when isSharedWithPatient is false', async () => {
      const completedScan = mockScan({
        status: 'COMPLETED',
        result: 'NORMAL',
        confidence: 0.90,
        isSharedWithPatient: false,
        patient: mockPatient({ userId: 'patient-user-1' }),
      });

      prismaMock.scan.findUnique.mockResolvedValue(
        mockScan({ isSharedWithPatient: false, patient: mockPatient({ userId: 'patient-user-1' }) }),
      );
      prismaMock.scan.update.mockResolvedValue(completedScan);

      await service.processScan('scan-1', 'clinician-1', 'CLINICIAN', {});

      const calls = notificationsMock.createNotification.mock.calls;
      const patientNotif = calls.find((c) => c[0].userId === 'patient-user-1');
      expect(patientNotif).toBeUndefined();
    });

    it('does NOT send patient notification when patient has no linked userId', async () => {
      const completedScan = mockScan({
        status: 'COMPLETED',
        result: 'NORMAL',
        confidence: 0.88,
        isSharedWithPatient: true,
        patient: mockPatient({ userId: null }), // no linked user
      });

      prismaMock.scan.findUnique.mockResolvedValue(
        mockScan({ patient: mockPatient({ userId: null }) }),
      );
      prismaMock.scan.update.mockResolvedValue(completedScan);

      await service.processScan('scan-1', 'clinician-1', 'CLINICIAN', {});

      const calls = notificationsMock.createNotification.mock.calls;
      // Should only notify clinician, no patient
      expect(calls.every((c) => c[0].userId === 'clinician-1' || c[0].userId === 'scan-1')).toBe(true);
    });

    it('throws NotFoundException when scan does not exist', async () => {
      prismaMock.scan.findUnique.mockResolvedValue(null);

      await expect(service.processScan('ghost-scan', 'clinician-1', 'CLINICIAN', {}))
        .rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when a different clinician tries to process the scan', async () => {
      prismaMock.scan.findUnique.mockResolvedValue(mockScan({ clinicianId: 'other-clinician' }));

      await expect(service.processScan('scan-1', 'clinician-1', 'CLINICIAN', {}))
        .rejects.toThrow(ForbiddenException);
    });

    it('allows an ADMIN to process any scan regardless of ownership', async () => {
      const completedScan = mockScan({
        status: 'COMPLETED',
        result: 'NORMAL',
        confidence: 0.91,
      });
      prismaMock.scan.findUnique.mockResolvedValue(mockScan({ clinicianId: 'other-clinician' }));
      prismaMock.scan.update.mockResolvedValue(completedScan);

      // Admin with different id should be allowed
      const result = await service.processScan('scan-1', 'admin-1', 'ADMIN', {});

      expect(result.id).toBe('scan-1');
    });
  });

  // ── getScansByDoctor ──────────────────────────────────────────────────────

  describe('getScansByDoctor', () => {
    it('returns only the clinician\'s own scans', async () => {
      prismaMock.scan.findMany.mockResolvedValue([mockScan(), mockScan({ id: 'scan-2' })]);

      const result = await service.getScansByDoctor('clinician-1', 'CLINICIAN');

      expect(prismaMock.scan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clinicianId: 'clinician-1' },
        }),
      );
      expect(result).toHaveLength(2);
    });

    it('returns all scans for ADMIN role', async () => {
      prismaMock.scan.findMany.mockResolvedValue([mockScan(), mockScan({ id: 'scan-2' }), mockScan({ id: 'scan-3' })]);

      const result = await service.getScansByDoctor('admin-1', 'ADMIN');

      expect(prismaMock.scan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
      expect(result).toHaveLength(3);
    });
  });

  // ── getScansByPatientUser ─────────────────────────────────────────────────

  describe('getScansByPatientUser', () => {
    it('returns scans filtered by patient userId', async () => {
      prismaMock.patientProfile.findUnique.mockResolvedValue({ userId: 'patient-user-1' });
      prismaMock.scan.findMany.mockResolvedValue([mockScan(), mockScan({ id: 'scan-2' })]);

      const result = await service.getScansByPatientUser('patient-user-1');

      expect(prismaMock.scan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { patient: { userId: 'patient-user-1' } },
        }),
      );
      expect(result).toHaveLength(2);
    });

    it('returns empty array when patient has no profile', async () => {
      prismaMock.patientProfile.findUnique.mockResolvedValue(null);

      const result = await service.getScansByPatientUser('patient-user-1');

      expect(prismaMock.scan.findMany).not.toHaveBeenCalled();
      expect(result).toHaveLength(0);
    });
  });

  // ── updatePatientNotes ────────────────────────────────────────────────────

  describe('updatePatientNotes', () => {
    it('updates patient notes successfully', async () => {
      prismaMock.scan.findUnique.mockResolvedValue(mockScan());
      prismaMock.patientProfile.findUnique.mockResolvedValue({ userId: 'patient-user-1' });
      prismaMock.scan.update.mockResolvedValue(mockScan({ patientNotes: 'Feeling better' }));

      const result = await service.updatePatientNotes('scan-1', 'Feeling better', 'patient-user-1');

      expect(prismaMock.scan.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { patientNotes: 'Feeling better' } }),
      );
      expect(result.patientNotes).toBe('Feeling better');
    });

    it('throws BadRequestException when notes exceed 1000 characters', async () => {
      const longNotes = 'a'.repeat(1001);

      await expect(
        service.updatePatientNotes('scan-1', longNotes, 'patient-user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when user has no patient profile', async () => {
      prismaMock.scan.findUnique.mockResolvedValue(mockScan());
      prismaMock.patientProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePatientNotes('scan-1', 'Some note', 'patient-user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
