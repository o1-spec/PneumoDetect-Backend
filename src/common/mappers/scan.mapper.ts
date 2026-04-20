import { Injectable } from '@nestjs/common';

@Injectable()
export class ScanMapper {
  toScanResponseDto(scan: any) {
    return {
      id: scan.id,
      imageUrl: scan.imageUrl,
      status: scan.status,
      result: scan.result,
      confidence: scan.confidence,
      patientId: scan.patientId,
      clinicianId: scan.clinicianId,
      createdAt: scan.createdAt,
      updatedAt: scan.updatedAt,
    };
  }

  toScanWithPatientDto(scan: any) {
    return {
      id: scan.id,
      imageUrl: scan.imageUrl,
      status: scan.status,
      result: scan.result,
      confidence: scan.confidence,
      patientName: scan.patient?.name,
      patientId: scan.patientId,
      clinicianId: scan.clinicianId,
      createdAt: scan.createdAt,
    };
  }

  toScansArray(scans: any[]) {
    return scans.map(scan => this.toScanResponseDto(scan));
  }
}
