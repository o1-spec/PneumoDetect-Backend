import { Injectable } from '@nestjs/common';

@Injectable()
export class ScanQueryBuilder {
  buildUserWhereClause(userId: string, userRole: string) {
    if (userRole === 'ADMIN') {
      return {};
    }

    return {
      clinicianId: userId,
    };
  }

  buildCompletedScansFilter() {
    return {
      status: 'COMPLETED',
      result: {
        not: null,
      },
    };
  }

  buildProcessingScansFilter(clinicianId?: string) {
    return {
      status: 'PROCESSING',
      ...(clinicianId && { clinicianId }),
    };
  }

  buildScansByResultFilter(result: string, clinicianId?: string) {
    return {
      result,
      ...(clinicianId && { clinicianId }),
    };
  }
}
