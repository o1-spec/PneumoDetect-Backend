export class RecentScanDto {
  id: string;
  result: string | null;
  status: string;
  confidence: number | null;
  createdAt: Date;
  patient: {
    id: string;
    name: string;
    idNumber: string;
  };
}

export class AnalyticsStatsDto {
  totalScans: number;
  completedScans: number;
  processingScans: number;
  failedScans: number;
  pneumoniaCases: number;
  normalCases: number;
  averageConfidence: number | null;
  recentScans: RecentScanDto[];

  constructor(partial: Partial<AnalyticsStatsDto>) {
    Object.assign(this, partial);
  }
}
