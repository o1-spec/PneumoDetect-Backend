import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get weekly activity data for charts
   */
  async getWeeklyActivity(userId?: string, userRole?: string) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const activityData: Array<{ day: string; scans: number; date: string }> = [];

    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(weekStart);
      dayStart.setDate(dayStart.getDate() + i);

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const scanCount = await this.prisma.scan.count({
        where: {
          createdAt: {
            gte: dayStart,
            lt: dayEnd,
          },
          ...(userRole === 'CLINICIAN' && { doctorId: userId }),
        },
      });

      activityData.push({
        day: daysOfWeek[i],
        scans: scanCount,
        date: dayStart.toISOString().split('T')[0],
      });
    }

    // Calculate trend
    const firstHalf = activityData.slice(0, 3).reduce((sum, d) => sum + d.scans, 0);
    const secondHalf = activityData.slice(3, 7).reduce((sum, d) => sum + d.scans, 0);
    const trend = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;

    return {
      data: activityData,
      trend: trend.toFixed(1),
      trendDirection: trend >= 0 ? 'up' : 'down',
    };
  }

  /**
   * Get recent scans with patient info
   */
  async getRecentScans(limit: number = 10, userId?: string, userRole?: string) {
    const scans = await this.prisma.scan.findMany({
      where: {
        ...(userRole === 'CLINICIAN' && { doctorId: userId }),
      },
      include: {
        patient: true,
        doctor: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return scans.map(scan => ({
      id: scan.id,
      patientName: scan.patient.name,
      patientId: scan.patient.id,
      result: scan.result,
      confidence: scan.confidence,
      status: scan.status,
      createdAt: scan.createdAt,
      imageUrl: scan.imageUrl,
      doctorName: scan.doctor.name,
    }));
  }

  /**
   * Get system status
   */
  async getSystemStatus() {
    try {
      // Check database connection
      const dbCheck = await this.prisma.user.count();
      const dbStatus = dbCheck >= 0 ? 'Connected' : 'Disconnected';

      // Get storage usage (from scans count and estimated size)
      const scanCount = await this.prisma.scan.count();
      // Estimate: average scan image is ~5MB
      const estimatedStorageUsed = (scanCount * 5) / 1024; // Convert to GB
      const totalStorageGB = 100; // Assume 100GB total
      const storagePercentage = Math.min((estimatedStorageUsed / totalStorageGB) * 100, 100);

      const aiModelStatus = 'Operational';

      return {
        aiModel: {
          name: 'AI Model',
          status: aiModelStatus,
          statusCode: 'operational',
        },
        database: {
          name: 'Database',
          status: dbStatus,
          statusCode: dbStatus === 'Connected' ? 'connected' : 'error',
          recordCount: dbCheck,
        },
        storage: {
          name: 'Storage',
          status: `${storagePercentage.toFixed(1)}% Used`,
          statusCode: storagePercentage > 90 ? 'warning' : 'operational',
          usedGB: estimatedStorageUsed.toFixed(2),
          totalGB: totalStorageGB,
          percentage: storagePercentage.toFixed(1),
        },
      };
    } catch (error) {
      return {
        aiModel: {
          name: 'AI Model',
          status: 'Unknown',
          statusCode: 'error',
        },
        database: {
          name: 'Database',
          status: 'Disconnected',
          statusCode: 'error',
        },
        storage: {
          name: 'Storage',
          status: 'Unknown',
          statusCode: 'error',
        },
      };
    }
  }

  /**
   * Get complete dashboard overview
   */
  async getDashboardOverview(userId?: string, userRole?: string) {
    const [weeklyActivity, recentScans, systemStatus] = await Promise.all([
      this.getWeeklyActivity(userId, userRole),
      this.getRecentScans(10, userId, userRole),
      this.getSystemStatus(),
    ]);

    // Get summary stats
    const totalScans = await this.prisma.scan.count({
      where: userRole === 'CLINICIAN' ? { doctorId: userId } : {},
    });

    const pneumoniaScans = await this.prisma.scan.count({
      where: {
        result: 'PNEUMONIA',
        ...(userRole === 'CLINICIAN' && { doctorId: userId }),
      },
    });

    const normalScans = await this.prisma.scan.count({
      where: {
        result: 'NORMAL',
        ...(userRole === 'CLINICIAN' && { doctorId: userId }),
      },
    });

    const processingScans = await this.prisma.scan.count({
      where: {
        status: 'PROCESSING',
        ...(userRole === 'CLINICIAN' && { doctorId: userId }),
      },
    });

    // Get average confidence
    const confidenceData = await this.prisma.scan.aggregate({
      _avg: { confidence: true },
      where: {
        confidence: { not: null },
        ...(userRole === 'CLINICIAN' && { doctorId: userId }),
      },
    });

    return {
      summary: {
        totalScans,
        pneumoniaDetected: pneumoniaScans,
        normalScans,
        processingScans,
        averageConfidence: confidenceData._avg.confidence?.toFixed(3) || 0,
      },
      weeklyActivity,
      recentScans,
      systemStatus,
    };
  }
}
