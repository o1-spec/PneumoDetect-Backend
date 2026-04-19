import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateScanDto } from './dto/create-scan.dto';
import { ProcessScanDto } from './dto/process-scan.dto';
import { ScanResponseDto } from './dto/scan-response.dto';
import { Result } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ScansService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  async createScan(
    createScanDto: CreateScanDto,
    fileBuffer: Buffer,
    fileName: string,
    doctorId: string,
  ): Promise<ScanResponseDto> {
    const { patientId } = createScanDto;

    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    try {
      const uploadedFile = await this.cloudinaryService.uploadImage(
        fileBuffer,
        `${Date.now()}-${Math.random().toString(36).substring(7)}`,
        'pneumodetect/scans',
      );

      const scan = await this.prisma.scan.create({
        data: {
          imageUrl: uploadedFile.secure_url,
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

      await this.notificationsService.createNotification({
        userId: doctorId,
        title: 'Scan Uploaded Successfully',
        message: `X-ray for patient ${patient.name} has been uploaded. Click to process.`,
        type: 'SCAN',
      });

      return new ScanResponseDto(scan);
    } catch (error) {
      throw new BadRequestException(
        `Failed to upload scan: ${error.message}`,
      );
    }
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

    if (userRole !== 'ADMIN' && scan.doctorId !== doctorId) {
      throw new ForbiddenException(
        'You can only process scans you created or you are an admin',
      );
    }

    await this.notificationsService.createNotification({
      userId: doctorId,
      title: 'Scan Processing Started',
      message: `X-ray for patient ${scan.patient.name} is being analyzed. Please wait...`,
      type: 'SCAN',
    });

    let mockResults;
    try {
      mockResults = this.generateMockAIResults();
    } catch (error) {
      await this.notificationsService.createNotification({
        userId: doctorId,
        title: 'Scan Processing Failed',
        message: `An error occurred while processing the X-ray for patient ${scan.patient.name}. Please try again.`,
        type: 'SYSTEM',
      });
      throw new BadRequestException('Failed to process scan');
    }

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

    try {
      if (updatedScan.result && updatedScan.confidence !== null) {
        const confidencePercent = (updatedScan.confidence * 100).toFixed(1);
        
        if (updatedScan.confidence > 0.90) {
          await this.notificationsService.createNotification({
            userId: scan.doctorId,
            title: 'High Confidence Result',
            message: `Scan shows ${updatedScan.result} with ${confidencePercent}% confidence for patient ${updatedScan.patient.name}`,
            type: 'SCAN',
          });
        } else if (updatedScan.confidence < 0.70) {
          await this.notificationsService.createNotification({
            userId: scan.doctorId,
            title: 'Low Confidence - Manual Review Recommended',
            message: `Scan confidence is ${confidencePercent}% for patient ${updatedScan.patient.name}. Please review manually.`,
            type: 'SYSTEM',
          });
        } else {
          await this.notificationsService.createNotification({
            userId: scan.doctorId,
            title: 'Scan Completed',
            message: `Your scan result is ready for patient ${updatedScan.patient.name}`,
            type: 'SCAN',
          });
        }
      }
    } catch (error) {
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
   * Get all scans for a specific patient
   * - Only allows doctor who created scans for that patient or admin
   * - Include patient and doctor info
   * - Order by newest first
   */
  async getScansByPatient(
    patientId: string,
    doctorId: string,
    userRole: string,
  ): Promise<ScanResponseDto[]> {
    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    // Get all scans for this patient
    const scans = await this.prisma.scan.findMany({
      where: { patientId },
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

    // If not admin, filter scans to only those created by this doctor
    if (userRole !== 'ADMIN') {
      const filteredScans = scans.filter(scan => scan.doctorId === doctorId);
      if (filteredScans.length === 0) {
        throw new ForbiddenException(
          'You can only view scans you created for this patient',
        );
      }
      return filteredScans.map(scan => new ScanResponseDto(scan));
    }

    return scans.map(scan => new ScanResponseDto(scan));
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
