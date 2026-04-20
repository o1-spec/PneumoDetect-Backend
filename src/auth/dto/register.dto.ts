import { IsEmail, IsString, MinLength, IsOptional, IsPhoneNumber, IsEnum, IsDateString, IsIn } from 'class-validator';
import { Role, Gender } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, {
    message: 'Password must be at least 8 characters long',
  })
  password: string;

  @IsString()
  name: string;

  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;


  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  yearsOfExperience?: number;

  @IsOptional()
  @IsString()
  licenseNumber?: string;


  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  bloodType?: string;

  @IsOptional()
  @IsString()
  medicalHistory?: string;
}
