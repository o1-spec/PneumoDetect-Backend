import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard/overview
   * Get complete dashboard with all widgets
   */
  @Get('overview')
  async getDashboardOverview(@CurrentUser() user: any) {
    return this.dashboardService.getDashboardOverview(user.id, user.role);
  }

  /**
   * GET /dashboard/weekly-activity
   * Get weekly activity chart data
   */
  @Get('weekly-activity')
  async getWeeklyActivity(@CurrentUser() user: any) {
    return this.dashboardService.getWeeklyActivity(user.id, user.role);
  }

  /**
   * GET /dashboard/recent-scans
   * Get recent scans
   */
  @Get('recent-scans')
  async getRecentScans(@CurrentUser() user: any) {
    return this.dashboardService.getRecentScans(10, user.id, user.role);
  }

  /**
   * GET /dashboard/system-status
   * Get system health status
   */
  @Get('system-status')
  async getSystemStatus() {
    return this.dashboardService.getSystemStatus();
  }
}
