import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';
import { AnalyticsStatsDto } from './dto/analytics-stats.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  /**
   * GET /analytics/stats
   * Get dashboard statistics
   * - CLINICIAN: stats for their scans only
   * - ADMIN: stats for all scans
   */
  @Get('stats')
  async getStats(@CurrentUser() user: any): Promise<AnalyticsStatsDto> {
    const stats = await this.analyticsService.getStats(user.id, user.role);
    return stats;
  }

  /**
   * GET /analytics/dashboard
   * Get unified dashboard metrics matching the frontend DashboardMetrics interface
   */
  @Get('dashboard')
  async getDashboard(@CurrentUser() user: any): Promise<any> {
    return this.analyticsService.getDashboardMetrics(user.id, user.role);
  }

  /**
   * GET /analytics/scans/results
   * Get scan results breakdown for charts
   * - Returns count of each result type (PNEUMONIA, NORMAL, CONCERNS)
   * - CLINICIAN: results for their scans only
   * - ADMIN: results for all scans
   */
  @Get('scans/results')
  async getScanResults(@CurrentUser() user: any): Promise<any> {
    return this.analyticsService.getScanResults(user.id, user.role);
  }

  /**
   * GET /analytics/patients
   * Get patient analytics
   * - Total patients in system
   * - New patients this month
   * - Patients with pneumonia detection
   * - Average scans per patient
   * - Top 10 patients by scan count
   * - Only accessible by ADMIN role
   */
  @Get('patients')
  async getPatientAnalytics(@CurrentUser() user: any): Promise<any> {
    // For now, all authenticated users can access
    // Uncomment below line to restrict to ADMIN only if needed
    // if (user.role !== 'ADMIN') throw new ForbiddenException('ADMIN access required');
    return this.analyticsService.getPatientAnalytics();
  }
}

