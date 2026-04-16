import { IsString, IsInt, IsEnum, Min, Max } from 'class-validator';
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
}
