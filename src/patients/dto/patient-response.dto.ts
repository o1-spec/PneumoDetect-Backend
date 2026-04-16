import { Gender } from '@prisma/client';

export class PatientResponseDto {
  id: string;
  idNumber: string;
  name: string;
  age: number;
  gender: Gender;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<PatientResponseDto>) {
    Object.assign(this, partial);
  }
}
