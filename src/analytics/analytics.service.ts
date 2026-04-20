import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsStatsDto, RecentScanDto } from './dto/analytics-stats.dto';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getStats(userId: string, userRole: string): Promise<AnalyticsStatsDto> {
    const whereClause = this.buildWhereClause(userId, userRole);

    const scans = await this.prisma.scan.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            idNumber: true,
          },
        },
      },
    });

    const stats = this.calculateStats(scans);
    const recentScans = await this.getRecentScans(userId, userRole, 5);

    return new AnalyticsStatsDto({
      ...stats,
      recentScans,
    });
  }

  private buildWhereClause(userId: string, userRole: string) {
    if (userRole === 'ADMIN') {
      return {};
    }

    return {
      clinicianId: userId,
    };
  }

  /**
   * Calculate all statistics from scans array
   * Counts:
   * - Total, completed, processing, failed scans
   * - Pneumonia_detected and normal cases
   * - Average confidence score
   */
  private calculateStats(
    scans: any[],
  ): Omit<AnalyticsStatsDto, 'recentScans'> {
    const totalScans = scans.length;

    // Count by status
    const completedScans = scans.filter(
      (s) => s.status === 'COMPLETED',
    ).length;
    const processingScans = scans.filter(
      (s) => s.status === 'PROCESSING',
    ).length;
    const failedScans = scans.filter((s) => s.status === 'FAILED').length;

    // Count by result (only completed scans have results)
    const completedWithResults = scans.filter(
      (s) => s.status === 'COMPLETED' && s.result !== null,
    );
    const pneumoniaCases = completedWithResults.filter(
      (s) => s.result === 'PNEUMONIA_DETECTED',
    ).length;
    const normalCases = completedWithResults.filter(
      (s) => s.result === 'NORMAL',
    ).length;

    // Calculate average confidence (only for completed scans with confidence)
    const scansWithConfidence = completedWithResults.filter(
      (s) => s.confidence !== null,
    );
    const averageConfidence =
      scansWithConfidence.length > 0
        ? parseFloat(
            (
              scansWithConfidence.reduce((sum, s) => sum + s.confidence, 0) /
              scansWithConfidence.length
            ).toFixed(4),
          )
        : null;

    return {
      totalScans,
      completedScans,
      processingScans,
      failedScans,
      pneumoniaCases,
      normalCases,
      averageConfidence,
    };
  }

  /**
   * Get recent scans (newest first)
   * Includes patient information
   * Limited to specified count
   */
  private async getRecentScans(
    userId: string,
    userRole: string,
    limit: number,
  ): Promise<RecentScanDto[]> {
    // Build where clause
    const whereClause = this.buildWhereClause(userId, userRole);

    // Fetch recent scans
    const scans = await this.prisma.scan.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            idNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Transform to DTO
    return scans.map(
      (scan) =>
        ({
          id: scan.id,
          result: scan.result,
          status: scan.status,
          confidence: scan.confidence,
          createdAt: scan.createdAt,
          patient: scan.patient,
        }) as RecentScanDto,
    );
  }

  /**
   * Get scan results breakdown for charts
   * - Returns count of each result type (PNEUMONIA_DETECTED, NORMAL, CONCERNS)
   * - Filtered by user role (CLINICIAN sees own, ADMIN sees all)
   */
  async getScanResults(userId: string, userRole: string): Promise<any> {
    const whereClause = this.buildWhereClause(userId, userRole);

    const scans = await this.prisma.scan.findMany({
      where: {
        ...whereClause,
        status: 'COMPLETED',
        result: {
          not: null,
        },
      },
    });

    const pneumoniaDetected = scans.filter(
      (s) => s.result === 'PNEUMONIA_DETECTED',
    ).length;
    const normal = scans.filter((s) => s.result === 'NORMAL').length;
    const concerns = scans.filter((s) => s.result === 'CONCERNS').length;

    return {
      pneumoniaDetected,
      normal,
      concerns,
      total: scans.length,
      breakdown: [
        {
          name: 'Pneumonia Detected',
          value: pneumoniaDetected,
          percentage:
            scans.length > 0
              ? ((pneumoniaDetected / scans.length) * 100).toFixed(1)
              : '0',
        },
        {
          name: 'Normal',
          value: normal,
          percentage:
            scans.length > 0
              ? ((normal / scans.length) * 100).toFixed(1)
              : '0',
        },
        {
          name: 'Concerns',
          value: concerns,
          percentage:
            scans.length > 0
              ? ((concerns / scans.length) * 100).toFixed(1)
              : '0',
        },
      ],
    };
  }
}

