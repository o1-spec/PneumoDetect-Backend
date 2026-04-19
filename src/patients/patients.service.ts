import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientResponseDto } from './dto/patient-response.dto';

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Create a new patient
   * Ensures idNumber is unique
   */
  async createPatient(createPatientDto: CreatePatientDto): Promise<PatientResponseDto> {
    const { idNumber, name, age, gender } = createPatientDto;

    // Check if patient with this idNumber already exists
    const existingPatient = await this.prisma.patient.findUnique({
      where: { idNumber },
    });

    if (existingPatient) {
      throw new ConflictException(
        `Patient with ID number ${idNumber} already exists`,
      );
    }

    // Validate age
    if (age < 0 || age > 150) {
      throw new BadRequestException('Age must be between 0 and 150');
    }

    // Create the patient
    const patient = await this.prisma.patient.create({
      data: {
        idNumber,
        name,
        age,
        gender,
      },
    });

    // Note: In a real system, you'd have a doctorId to notify
    // For now, we'll create a system notification
    try {
      await this.notificationsService.createNotification({
        userId: 'admin', // This should be the doctor's ID in a real system
        title: 'Patient Added',
        message: `New patient ${name} (ID: ${idNumber}) has been added to the system.`,
        type: 'USER',
      });
    } catch (error) {
      console.error('Failed to create patient notification:', error);
    }

    return new PatientResponseDto(patient);
  }

  /**
   * Get all patients
   * Returns a list of all patients in the system
   */
  async getAllPatients(): Promise<PatientResponseDto[]> {
    const patients = await this.prisma.patient.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return patients.map((patient) => new PatientResponseDto(patient));
  }

  /**
   * Get a specific patient by ID
   * Optionally includes related scans
   */
  async getPatientById(
    patientId: string,
    includeScans: boolean = false,
  ): Promise<PatientResponseDto> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        scans: includeScans
          ? {
              select: {
                id: true,
                status: true,
                result: true,
                confidence: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            }
          : false,
      },
    });

    if (!patient) {
      throw new NotFoundException(
        `Patient with ID ${patientId} not found`,
      );
    }

    return new PatientResponseDto(patient);
  }

  /**
   * Get patient by ID number (unique identifier)
   * Used for lookup by medical/ID number
   */
  async getPatientByIdNumber(idNumber: string): Promise<PatientResponseDto> {
    const patient = await this.prisma.patient.findUnique({
      where: { idNumber },
    });

    if (!patient) {
      throw new NotFoundException(
        `Patient with ID number ${idNumber} not found`,
      );
    }

    return new PatientResponseDto(patient);
  }

  /**
   * Update patient information
   * Allows updating name, age, gender (but not idNumber)
   */
  async updatePatient(
    patientId: string,
    updateData: Partial<CreatePatientDto>,
  ): Promise<PatientResponseDto> {
    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException(
        `Patient with ID ${patientId} not found`,
      );
    }

    // Prevent updating idNumber (immutable)
    const { idNumber, ...updateFields } = updateData;

    const updatedPatient = await this.prisma.patient.update({
      where: { id: patientId },
      data: updateFields,
    });

    try {
      await this.notificationsService.createNotification({
        userId: 'admin',
        title: 'Patient Updated',
        message: `Patient ${updatedPatient.name} (ID: ${updatedPatient.idNumber}) information has been updated.`,
        type: 'USER',
      });
    } catch (error) {
      console.error('Failed to create patient update notification:', error);
    }

    return new PatientResponseDto(updatedPatient);
  }

  /**
   * Delete a patient
   * Cascades to delete related scans (configured in Prisma schema)
   */
  async deletePatient(patientId: string): Promise<{ message: string }> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException(
        `Patient with ID ${patientId} not found`,
      );
    }

    await this.prisma.patient.delete({
      where: { id: patientId },
    });

    return { message: `Patient ${patientId} deleted successfully` };
  }

  /**
   * Check if patient exists
   * Useful for validation in other services
   */
  async patientExists(patientId: string): Promise<boolean> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    return patient !== null;
  }
}
