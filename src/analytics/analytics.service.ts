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

  private calculateStats(
    scans: any[],
  ): Omit<AnalyticsStatsDto, 'recentScans'> {
    const totalScans = scans.length;

    const completedScans = scans.filter(
      (s) => s.status === 'COMPLETED',
    ).length;
    const processingScans = scans.filter(
      (s) => s.status === 'PROCESSING',
    ).length;
    const failedScans = scans.filter((s) => s.status === 'FAILED').length;

    const completedWithResults = scans.filter(
      (s) => s.status === 'COMPLETED' && s.result !== null,
    );
    const pneumoniaCases = completedWithResults.filter(
      (s) => s.result === 'PNEUMONIA_DETECTED',
    ).length;
    const normalCases = completedWithResults.filter(
      (s) => s.result === 'NORMAL',
    ).length;


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

  private async getRecentScans(
    userId: string,
    userRole: string,
    limit: number,
  ): Promise<RecentScanDto[]> {
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
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

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
      orderBy: { createdAt: 'asc' },
    });

    if (scans.length === 0) {
      return {
        resultBreakdown: {
          pneumonia: 0,
          normal: 0,
          concerns: 0,
          pneumoniaPercentage: 0,
          normalPercentage: 0,
          concernsPercentage: 0,
        },
        confidenceDistribution: {
          excellent: 0,
          good: 0,
          fair: 0,
        },
        timelineData: [],
        totalScans: 0,
        averageConfidence: 0,
      };
    }

    const pneumoniaCount = scans.filter(
      (s) => s.result === 'PNEUMONIA_DETECTED',
    ).length;
    const normalCount = scans.filter((s) => s.result === 'NORMAL').length;
    const concernsCount = scans.filter((s) => s.result === 'CONCERNS').length;

    const total = scans.length;
    const resultBreakdown = {
      pneumonia: pneumoniaCount,
      normal: normalCount,
      concerns: concernsCount,
      pneumoniaPercentage: parseFloat(
        ((pneumoniaCount / total) * 100).toFixed(2),
      ),
      normalPercentage: parseFloat(((normalCount / total) * 100).toFixed(2)),
      concernsPercentage: parseFloat(
        ((concernsCount / total) * 100).toFixed(2),
      ),
    };

    const scansWithConfidence = scans.filter((s) => s.confidence !== null);
    const excellent = scansWithConfidence.filter(
      (s) => s.confidence! > 0.9,
    ).length;
    const good = scansWithConfidence.filter(
      (s) => s.confidence! >= 0.8 && s.confidence! <= 0.9,
    ).length;
    const fair = scansWithConfidence.filter(
      (s) => s.confidence! < 0.8,
    ).length;

    const confidenceDistribution = {
      excellent,
      good,
      fair,
    };

    const totalConfidence = scansWithConfidence.reduce(
      (sum, s) => sum + s.confidence!,
      0,
    );
    const averageConfidence =
      scansWithConfidence.length > 0
        ? parseFloat((totalConfidence / scansWithConfidence.length).toFixed(4))
        : 0;

    const timelineData: any[] = [];
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 6);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(last7Days);
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      const dayScansPneumonia = scans.filter(
        (s) =>
          s.createdAt.toISOString().split('T')[0] === dateStr &&
          s.result === 'PNEUMONIA_DETECTED',
      );
      const dayScansNormal = scans.filter(
        (s) =>
          s.createdAt.toISOString().split('T')[0] === dateStr &&
          s.result === 'NORMAL',
      );
      const dayScansConcerns = scans.filter(
        (s) =>
          s.createdAt.toISOString().split('T')[0] === dateStr &&
          s.result === 'CONCERNS',
      );

      const dayScans = [...dayScansPneumonia, ...dayScansNormal, ...dayScansConcerns];
      const dayConfidences = dayScans
        .filter((s) => s.confidence !== null)
        .map((s) => s.confidence!);
      const dayAverageConfidence =
        dayConfidences.length > 0
          ? parseFloat(
              (
                dayConfidences.reduce((a, b) => a + b, 0) /
                dayConfidences.length
              ).toFixed(4),
            )
          : 0;

      timelineData.push({
        date: dateStr,
        scans: dayScans.length,
        pneumonia: dayScansPneumonia.length,
        normal: dayScansNormal.length,
        concerns: dayScansConcerns.length,
        averageConfidence: dayAverageConfidence,
      });
    }

    return {
      resultBreakdown,
      confidenceDistribution,
      timelineData,
      totalScans: total,
      averageConfidence,
    };
  }
}

