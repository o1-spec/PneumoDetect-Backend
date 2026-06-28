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

  clinicianId: string;
  clinician: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };

  constructor(partial: Partial<ScanResponseDto>) {
    Object.assign(this, partial);
    if (this.confidence !== null && this.confidence !== undefined && this.confidence <= 1.0) {
      this.confidence = Math.round(this.confidence * 10000) / 100;
    }
  }
}
