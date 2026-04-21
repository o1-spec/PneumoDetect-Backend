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


    const existingPatient = await this.prisma.patient.findUnique({
      where: { idNumber },
    });

    if (existingPatient) {
      throw new ConflictException(
        `Patient with ID number ${idNumber} already exists`,
      );
    }


    if (age < 0 || age > 150) {
      throw new BadRequestException('Age must be between 0 and 150');
    }


    const patient = await this.prisma.patient.create({
      data: {
        idNumber,
        name,
        age,
        gender,
      },
    });



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

    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException(
        `Patient with ID ${patientId} not found`,
      );
    }


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

  /**
   * Link a Patient clinical record to a registered User account (PATIENT role)
   * - Allows admins to connect a clinical patient record to the patient's login
   * - This enables scan result notifications to be delivered to the patient user
   * - Only one patient record can be linked to each user (enforced by unique constraint)
   */
  async linkPatientUser(patientId: string, userId: string): Promise<PatientResponseDto> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.role !== 'PATIENT') {
      throw new BadRequestException('Only users with the PATIENT role can be linked to a patient record');
    }

    // Check if this user is already linked to another patient record
    const existingLink = await this.prisma.patient.findFirst({
      where: { userId },
    });

    if (existingLink && existingLink.id !== patientId) {
      throw new BadRequestException(`User is already linked to another patient record (ID: ${existingLink.id})`);
    }

    const updatedPatient = await this.prisma.patient.update({
      where: { id: patientId },
      data: { userId },
    });

    // Notify the patient that their records are now accessible
    try {
      await this.notificationsService.createNotification({
        userId,
        title: 'Account Linked',
        message: `Your account has been linked to your medical records. You can now view your scan results in the app.`,
        type: 'USER',
      });
    } catch (error) {
      console.error('Failed to send link notification:', error);
    }

    return new PatientResponseDto(updatedPatient);
  }
}
