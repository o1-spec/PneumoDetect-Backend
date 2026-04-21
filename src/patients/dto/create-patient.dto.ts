import { IsString, IsInt, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { Gender } from '@prisma/client';

export class CreatePatientDto {
  @IsString()
  idNumber: string;

  @IsString()
  name: string;

  @IsInt()
  @Min(0)
  @Max(150)
  age: number;

  @IsEnum(Gender)
  gender: Gender;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class LinkPatientUserDto {
  @IsString()
  userId: string;
}
