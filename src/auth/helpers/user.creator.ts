import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from '../dto/register.dto';
import { PasswordHelper } from './password.helper';
import { OtpHelper } from './otp.helper';

@Injectable()
export class UserCreator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHelper: PasswordHelper,
    private readonly otpHelper: OtpHelper,
  ) {}

  async createUser(registerDto: RegisterDto): Promise<any> {
    const { email, password, name, specialization, phone, role } = registerDto;

    const hashedPassword = await this.passwordHelper.hash(password);
    const otp = this.otpHelper.generateOtp();
    const otpExpiry = this.otpHelper.getOtpExpiry();

    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        specialization: role === Role.CLINICIAN ? specialization : undefined,
        phone,
        role: role || Role.CLINICIAN,
        otp,
        otpExpiry,
      },
    });
  }

  async createPatientProfile(userId: string, registerDto: RegisterDto): Promise<void> {
    const { dateOfBirth, gender, bloodType, medicalHistory } = registerDto;

    if (dateOfBirth && gender) {
      await this.prisma.patientProfile.create({
        data: {
          userId,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          bloodType,
          medicalHistory,
        },
      });
    }
  }
}
