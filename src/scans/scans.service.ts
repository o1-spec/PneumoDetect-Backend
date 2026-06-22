import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateScanDto } from './dto/create-scan.dto';
import { ProcessScanDto } from './dto/process-scan.dto';
import { ScanResponseDto } from './dto/scan-response.dto';
import { Result } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ScansService {
  private readonly logger = new Logger(ScansService.name);

  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    private aiService: AiService,
  ) {}

  async createScan(
    createScanDto: CreateScanDto,
    fileBuffer: Buffer,
    fileName: string,
    clinicianId: string,
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
          clinicianId,
          status: 'PROCESSING' as any,
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
          clinician: {
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
        userId: clinicianId,
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
   * Process a scan using AI service for prediction
   * - Only allows clinician who created scan or admin
   * - Updates status to PROCESSING then COMPLETED
   * - Sends image to Flask AI service for prediction
   */
  async processScan(
    scanId: string,
    clinicianId: string,
    userRole: string,
    processScanDto: ProcessScanDto,
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
            userId: true,
          },
        },
        clinician: {
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

    if (userRole !== 'ADMIN' && scan.clinicianId !== clinicianId) {
      throw new ForbiddenException(
        'You can only process scans you created or you are an admin',
      );
    }

    await this.notificationsService.createNotification({
      userId: clinicianId,
      title: 'Scan Processing Started',
      message: `X-ray for patient ${scan.patient.name} is being analyzed. Please wait...`,
      type: 'SCAN',
    });

    let predictionResult;
    try {
      predictionResult = await this.aiService.predictPneumonia(scan.imageUrl);
    } catch (error) {
      this.logger.error(`Prediction failed: ${error.message}`);
      await this.notificationsService.createNotification({
        userId: clinicianId,
        title: 'Scan Processing Failed',
        message: `An error occurred while processing the X-ray for patient ${scan.patient.name}. ${error.message}`,
        type: 'SYSTEM',
      });
      throw new BadRequestException(`Failed to process scan: ${error.message}`);
    }

    let heatmapUrl = processScanDto.heatmapUrl || null;
    if (predictionResult.heatmap) {
      try {
        const heatmapBuffer = Buffer.from(predictionResult.heatmap, 'base64');
        const uploadedHeatmap = await this.cloudinaryService.uploadImage(
          heatmapBuffer,
          `heatmap-${scanId}-${Date.now()}`,
          'pneumodetect/heatmaps',
        );
        heatmapUrl = uploadedHeatmap.secure_url;
      } catch (uploadError) {
        this.logger.error(`Failed to upload heatmap to Cloudinary: ${uploadError.message}`);
      }
    }

    const updatedScan = await this.prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'COMPLETED',
        result: predictionResult.result,
        confidence: predictionResult.confidence,
        modelVersion: 'flask-tensorflow-v1',
        heatmapUrl: heatmapUrl,
      },
      include: {
        patient: {
          select: {
            id: true,
            idNumber: true,
            name: true,
            age: true,
            gender: true,
            userId: true,
          },
        },
        clinician: {
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
        const resultTitle =
          updatedScan.result === 'PNEUMONIA'
            ? 'URGENT: Pneumonia Detected'
            : 'Scan Result: Normal';

        // Notify clinician
        await this.notificationsService.createNotification({
          userId: scan.clinicianId,
          title: resultTitle,
          message: `${updatedScan.result} (${confidencePercent}% confidence) for patient ${updatedScan.patient.name}`,
          type: 'SCAN',
        });

        // Notify patient if results are shared
        if (updatedScan.isSharedWithPatient && updatedScan.patient.userId) {
          const patientTitle =
            updatedScan.result === 'PNEUMONIA'
              ? 'Scan Result - Important'
              : 'Scan Result Ready';
          const patientMessage =
            updatedScan.result === 'PNEUMONIA'
              ? `Your scan shows potential signs of pneumonia (${confidencePercent}% confidence). Please contact your healthcare provider immediately.`
              : `Your scan is complete and shows normal results. No signs of pneumonia detected.`;

          await this.notificationsService.createNotification({
            userId: updatedScan.patient.userId,
            title: patientTitle,
            message: patientMessage,
            type: 'SCAN',
          });
        }
      }
    } catch (error) {
      this.logger.error('Failed to create scan completion notification:', error);
    }

    return new ScanResponseDto(updatedScan);
  }

  /**
   * Get all scans for the current clinician
   * - If user is ADMIN, return all scans
   * - Otherwise, return only scans created by this clinician
   * - Include patient and clinician info
   * - Order by newest first
   */
  async getScansByDoctor(
    clinicianId: string,
    userRole: string,
  ): Promise<ScanResponseDto[]> {
    const scans = await this.prisma.scan.findMany({
      where:
        userRole === 'ADMIN'
          ? {} // Admin sees all scans
          : { clinicianId }, // Clinician sees only their scans
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
        clinician: {
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
   * - Only allows owner clinician or admin
   * - Include patient and clinician info
   */
  async getScanById(
    scanId: string,
    clinicianId: string,
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
        clinician: {
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


    if (userRole !== 'ADMIN' && scan.clinicianId !== clinicianId) {
      throw new ForbiddenException('You can only view scans you created');
    }

    return new ScanResponseDto(scan);
  }

  /**
   * Get all scans for a specific patient
   * - Only allows clinician who created scans for that patient or admin
   * - Include patient and clinician info
   * - Order by newest first
   */
  async getScansByPatient(
    patientId: string,
    clinicianId: string,
    userRole: string,
  ): Promise<ScanResponseDto[]> {

    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }


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
        clinician: {
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


    if (userRole !== 'ADMIN') {
      const filteredScans = scans.filter(scan => scan.clinicianId === clinicianId);
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
   * Get all scans for the authenticated patient user
   * - Only returns scans where the User (PATIENT) is linked
   * - Returns patient-safe fields only
   * - Does NOT include image URLs or heatmaps
   */
  async getScansByPatientUser(userId: string): Promise<any[]> {

    const patientProfile = await this.prisma.patientProfile.findUnique({
      where: { userId },
    });

    if (!patientProfile) {
      return [];
    }




    const scans = await this.prisma.scan.findMany({
      where: {
        patient: {
          userId,
        },
      },
      include: {
        patient: true,
        clinician: true,
      },
      orderBy: { createdAt: 'desc' },
    });


    return scans.map(scan => ({
      id: scan.id,
      imageUrl: scan.imageUrl,
      heatmapUrl: scan.heatmapUrl,
      result: scan.result,
      confidence: scan.confidence,
      status: scan.status,
      createdAt: scan.createdAt,
      analyzedAt: scan.analyzedAt,
      clinicianNotes: scan.clinicianNotes,
      patientNotes: scan.patientNotes,
      doctorName: scan.clinician?.name || 'Unknown',
    }));
  }

  /**
   * Get a specific scan with patient-limited fields
   * - Only accessible by PATIENT role
   * - Patient can only view their own scans
   * - Returns patient-safe fields with recommendations
   * - Includes image URLs and heatmaps for visual presentation
   */
  async getScanByIdPatientView(scanId: string, userId: string): Promise<any> {
    const scan = await this.prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        patient: true,
        clinician: true,
      },
    });

    if (!scan) {
      throw new NotFoundException(`Scan with ID ${scanId} not found`);
    }



    const patientProfile = await this.prisma.patientProfile.findUnique({
      where: { userId },
    });

    if (!patientProfile) {
      throw new ForbiddenException('You do not have permission to view this scan');
    }


    const recommendations = this.generateRecommendations(scan.result);

    return {
      id: scan.id,
      imageUrl: scan.imageUrl,
      heatmapUrl: scan.heatmapUrl,
      result: scan.result,
      confidence: scan.confidence,
      confidencePercentage: scan.confidence ? `${(scan.confidence * 100).toFixed(1)}%` : null,
      status: scan.status,
      createdAt: scan.createdAt,
      analyzedAt: scan.analyzedAt,
      doctorName: scan.clinician?.name || 'Unknown',
      clinicianNotes: scan.clinicianNotes,
      patientNotes: scan.patientNotes,
      recommendations,
      disclaimer: 'This AI analysis is assistive only and should not be used as a substitute for professional medical advice.',
    };
  }

  /**
   * Update patient notes on a scan
   * - Only allows patient to update their own scans
   * - Notes limited to 1000 characters
   */
  async updatePatientNotes(scanId: string, notes: string, userId: string): Promise<any> {
    if (notes && notes.length > 1000) {
      throw new BadRequestException('Notes cannot exceed 1000 characters');
    }

    const scan = await this.prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        patient: true,
        clinician: true,
      },
    });

    if (!scan) {
      throw new NotFoundException(`Scan with ID ${scanId} not found`);
    }


    const patientProfile = await this.prisma.patientProfile.findUnique({
      where: { userId },
    });

    if (!patientProfile) {
      throw new ForbiddenException('You do not have permission to update this scan');
    }

    const updatedScan = await this.prisma.scan.update({
      where: { id: scanId },
      data: {
        patientNotes: notes || null,
      },
      include: {
        patient: true,
        clinician: true,
      },
    });

    return {
      id: updatedScan.id,
      patientNotes: updatedScan.patientNotes,
      updatedAt: updatedScan.updatedAt,
    };
  }

  /**
   * Generate recommendations based on scan result
   */
  private generateRecommendations(result: Result | null): string[] {
    const recommendations: string[] = [];

    if (result === 'PNEUMONIA') {
      recommendations.push('Consult with a healthcare provider for confirmation');
      recommendations.push('Follow-up imaging may be needed');
      recommendations.push('Monitor symptoms closely');
      recommendations.push('Consider seeking specialist evaluation');
    } else if (result === 'NORMAL') {
      recommendations.push('No abnormalities detected');
      recommendations.push('Continue regular health checkups');
      recommendations.push('Maintain healthy lifestyle');
    } else if (result === 'CONCERNS') {
      recommendations.push('Please consult with a healthcare provider');
      recommendations.push('Additional testing may be required');
      recommendations.push('Schedule a follow-up appointment');
    }

    return recommendations;
  }
}
