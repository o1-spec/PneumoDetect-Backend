import { Exclude } from 'class-transformer';

export class ScanResponseDto {
  id: string;
  imageUrl: string;
  heatmapUrl: string | null;
  status: string;
  result: string | null;
  confidence: number | null;
  modelVersion: string | null;
  createdAt: Date;
  updatedAt: Date;

  patientId: string;
  patient: {
    id: string;
    idNumber: string;
    name: string;
    age: number;
    gender: string;
  };

  doctorId: string;
  doctor: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };

  constructor(partial: Partial<ScanResponseDto>) {
    Object.assign(this, partial);
  }
}
