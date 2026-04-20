import { BadRequestException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RegisterDto } from '../dto/register.dto';

@Injectable()
export class AuthValidator {
  validatePatientFields(role: Role, dto: RegisterDto): void {
    if (role === Role.PATIENT) {
      if (!dto.dateOfBirth || !dto.gender) {
        throw new BadRequestException(
          'dateOfBirth and gender are required for PATIENT role',
        );
      }
    }
  }

  validateClinicianFields(role: Role, dto: RegisterDto): void {
    if (role === Role.CLINICIAN) {
      if (!dto.specialization) {
        throw new BadRequestException(
          'specialization is required for CLINICIAN role',
        );
      }
    }
  }
}
