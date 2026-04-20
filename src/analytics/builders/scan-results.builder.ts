import { Injectable } from '@nestjs/common';

export interface ResultBreakdown {
  pneumonia: number;
  normal: number;
  concerns: number;
  pneumoniaPercentage: number;
  normalPercentage: number;
  concernsPercentage: number;
}

export interface ConfidenceDistribution {
  excellent: number;
  good: number;
  fair: number;
}

export interface TimelineEntry {
  date: string;
  scans: number;
  pneumonia: number;
  normal: number;
  concerns: number;
  averageConfidence: number;
}

@Injectable()
export class ScanResultsBuilder {
  calculateResultBreakdown(scans: any[]): ResultBreakdown {
    const pneumoniaCount = scans.filter(
      (s) => s.result === 'PNEUMONIA_DETECTED',
    ).length;
    const normalCount = scans.filter((s) => s.result === 'NORMAL').length;
    const concernsCount = scans.filter((s) => s.result === 'CONCERNS').length;

    const total = scans.length;

    return {
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
  }

  calculateConfidenceDistribution(scans: any[]): ConfidenceDistribution {
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

    return { excellent, good, fair };
  }

  calculateAverageConfidence(scans: any[]): number {
    const scansWithConfidence = scans.filter((s) => s.confidence !== null);
    if (scansWithConfidence.length === 0) return 0;

    const totalConfidence = scansWithConfidence.reduce(
      (sum, s) => sum + s.confidence!,
      0,
    );

    return parseFloat(
      (totalConfidence / scansWithConfidence.length).toFixed(4),
    );
  }

  buildTimelineData(scans: any[]): TimelineEntry[] {
    const timelineData: TimelineEntry[] = [];
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

      const dayScans = [
        ...dayScansPneumonia,
        ...dayScansNormal,
        ...dayScansConcerns,
      ];
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

    return timelineData;
  }
}
