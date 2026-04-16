import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsStatsDto, RecentScanDto } from './dto/analytics-stats.dto';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get analytics stats for the dashboard
   * - If user is CLINICIAN: returns stats only for their scans
   * - If user is ADMIN: returns stats for all scans
   */
  async getStats(userId: string, userRole: string): Promise<AnalyticsStatsDto> {
    // Build where clause based on role
    const whereClause = this.buildWhereClause(userId, userRole);

    // Fetch all scans matching the criteria
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

    // Calculate all statistics
    const stats = this.calculateStats(scans);

    // Get recent scans (latest 5)
    const recentScans = await this.getRecentScans(userId, userRole, 5);

    return new AnalyticsStatsDto({
      ...stats,
      recentScans,
    });
  }

  /**
   * Build Prisma where clause based on user role
   * - CLINICIAN: only their scans (doctorId === userId)
   * - ADMIN: all scans
   */
  private buildWhereClause(userId: string, userRole: string) {
    if (userRole === 'ADMIN') {
      // Admin sees all scans
      return {};
    }

    // Clinician sees only their scans
    return {
      doctorId: userId,
    };
  }

  /**
   * Calculate all statistics from scans array
   * Counts:
   * - Total, completed, processing, failed scans
   * - Pneumonia and normal cases
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
      (s) => s.result === 'PNEUMONIA',
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
}
