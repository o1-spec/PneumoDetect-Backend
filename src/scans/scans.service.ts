import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScanDto } from './dto/create-scan.dto';
import { ProcessScanDto } from './dto/process-scan.dto';
import { ScanResponseDto } from './dto/scan-response.dto';
import { Result } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ScansService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Create a new scan record after file upload
   * - Validates patient exists
   * - Creates scan with UPLOADED status
   * - Returns scan with related patient and doctor info
   */
  async createScan(
    createScanDto: CreateScanDto,
    imageUrl: string,
    doctorId: string,
  ): Promise<ScanResponseDto> {
    const { patientId } = createScanDto;

    // Validate patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    // Create scan record
    const scan = await this.prisma.scan.create({
      data: {
        imageUrl,
        patientId,
        doctorId,
        status: 'UPLOADED',
      },
      include: {
        patient: {
          select: {
            id: true,
            idNumber: true,
            name: true,
            age: true,
            gender: true,
          },
        },
        doctor: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return new ScanResponseDto(scan);
  }

  /**
   * Process a scan with mock AI results
   * - Only allows doctor who created scan or admin
   * - Updates status to PROCESSING then COMPLETED
   * - Sets mock AI results: result (PNEUMONIA/NORMAL), confidence (0.85-0.99)
   */
  async processScan(
    scanId: string,
    doctorId: string,
    userRole: string,
    processScanDto: ProcessScanDto,
  ): Promise<ScanResponseDto> {
    // Fetch the scan
    const scan = await this.prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        patient: {
          select: {
            id: true,
            idNumber: true,
            name: true,
            age: true,
            gender: true,
          },
        },
        doctor: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!scan) {
      throw new NotFoundException(`Scan with ID ${scanId} not found`);
    }

    // Check ownership: only doctor who created it or admin can process
    if (userRole !== 'ADMIN' && scan.doctorId !== doctorId) {
      throw new ForbiddenException(
        'You can only process scans you created or you are an admin',
      );
    }

    // Simulate AI processing: generate mock results
    const mockResults = this.generateMockAIResults();

    // Update scan with processing results
    const updatedScan = await this.prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'COMPLETED',
        result: mockResults.result,
        confidence: mockResults.confidence,
        modelVersion: 'mock-v1',
        heatmapUrl: processScanDto.heatmapUrl || null,
      },
      include: {
        patient: {
          select: {
            id: true,
            idNumber: true,
            name: true,
            age: true,
            gender: true,
          },
        },
        doctor: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Create notification for the doctor when scan is completed
    try {
      if (updatedScan.result) {
        await this.notificationsService.createScanCompletionNotification(
          scan.doctorId,
          updatedScan.patient.name,
          updatedScan.result,
        );
      }
    } catch (error) {
      // Log but don't throw - notification failure shouldn't fail scan processing
      console.error('Failed to create scan completion notification:', error);
    }

    return new ScanResponseDto(updatedScan);
  }

  /**
   * Get all scans for the current doctor
   * - If user is ADMIN, return all scans
   * - Otherwise, return only scans created by this doctor
   * - Include patient and doctor info
   * - Order by newest first
   */
  async getScansByDoctor(
    doctorId: string,
    userRole: string,
  ): Promise<ScanResponseDto[]> {
    const scans = await this.prisma.scan.findMany({
      where:
        userRole === 'ADMIN'
          ? {} // Admin sees all scans
          : { doctorId }, // Doctor sees only their scans
      include: {
        patient: {
          select: {
            id: true,
            idNumber: true,
            name: true,
            age: true,
            gender: true,
          },
        },
        doctor: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return scans.map((scan) => new ScanResponseDto(scan));
  }

  /**
   * Get a single scan by ID
   * - Only allows owner doctor or admin
   * - Include patient and doctor info
   */
  async getScanById(
    scanId: string,
    doctorId: string,
    userRole: string,
  ): Promise<ScanResponseDto> {
    const scan = await this.prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        patient: {
          select: {
            id: true,
            idNumber: true,
            name: true,
            age: true,
            gender: true,
          },
        },
        doctor: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!scan) {
      throw new NotFoundException(`Scan with ID ${scanId} not found`);
    }

    // Check ownership: only doctor who created it or admin can view
    if (userRole !== 'ADMIN' && scan.doctorId !== doctorId) {
      throw new ForbiddenException('You can only view scans you created');
    }

    return new ScanResponseDto(scan);
  }

  /**
   * Check if a scan exists (helper method)
   */
  async scanExists(scanId: string): Promise<boolean> {
    const scan = await this.prisma.scan.findUnique({
      where: { id: scanId },
    });
    return !!scan;
  }

  /**
   * Generate mock AI results for testing
   * - Randomly selects PNEUMONIA or NORMAL
   * - Generates realistic confidence score (0.85-0.99)
   */
  private generateMockAIResults(): { result: Result; confidence: number } {
    const results: Result[] = ['PNEUMONIA', 'NORMAL'];
    const randomResult = results[Math.floor(Math.random() * results.length)];
    
    // Generate confidence between 0.85 and 0.99
    const confidence = parseFloat((Math.random() * 0.14 + 0.85).toFixed(4));

    return {
      result: randomResult as Result,
      confidence,
    };
  }
}
