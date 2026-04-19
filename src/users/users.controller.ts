import { Controller, Get, Patch, Post, Body, UseGuards, Res, Query } from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { RecentActivityDto } from './dto/recent-activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get current user profile
   * GET /users/me or GET /auth/me (alias)
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access_token')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: any): Promise<UserResponseDto> {
    return this.usersService.getProfile(user.id);
  }

  /**
   * Update current user profile
   * PATCH /users/profile
   */
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access_token')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  /**
   * Download user's personal data (GDPR compliance)
   * GET /users/download-data
   */
  @Get('download-data')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access_token')
  @ApiOperation({ summary: 'Download all personal data as JSON' })
  @ApiResponse({
    status: 200,
    description: 'User data exported as JSON file',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async downloadData(@CurrentUser() user: any, @Res() res: Response): Promise<void> {
    const jsonData = await this.usersService.downloadMyData(user.id);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-${user.id}-${Date.now()}.json"`);
    res.send(jsonData);
  }

  /**
   * Get recent activity for the current user
   * GET /users/recent-activity
   */
  @Get('recent-activity')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access_token')
  @ApiOperation({ summary: 'Get recent user activity (scans, notifications, profile updates)' })
  @ApiResponse({
    status: 200,
    description: 'Recent activity list',
    isArray: true,
    type: RecentActivityDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRecentActivity(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
  ): Promise<RecentActivityDto[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.usersService.getRecentActivity(user.id, parsedLimit);
  }

  /**
   * Delete user account and all data (permanent, requires password)
   * DELETE /users/delete-account
   */
  @Post('delete-account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access_token')
  @ApiOperation({ summary: 'Permanently delete account and all data' })
  @ApiResponse({
    status: 200,
    description: 'Account and data deleted successfully',
    schema: {
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid password or deletion failed',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAccount(
    @CurrentUser() user: any,
    @Body() deleteAccountDto: DeleteAccountDto,
  ): Promise<{ message: string }> {
    return this.usersService.deleteAccount(user.id, deleteAccountDto);
  }
}
