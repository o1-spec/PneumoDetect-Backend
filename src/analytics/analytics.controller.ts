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
}
