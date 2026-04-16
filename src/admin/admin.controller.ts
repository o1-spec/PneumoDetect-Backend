import { Controller, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Get all users
   * GET /admin/users
   * Only accessible by ADMIN
   */
  @Get('users')
  @Roles(Role.ADMIN)
  async getAllUsers(): Promise<UserResponseDto[]> {
    return this.adminService.getAllUsers();
  }

  /**
   * Get a single user by ID
   * GET /admin/users/:id
   * Only accessible by ADMIN
   */
  @Get('users/:id')
  @Roles(Role.ADMIN)
  async getUserById(@Param('id') userId: string): Promise<UserResponseDto> {
    return this.adminService.getUserById(userId);
  }

  /**
   * Update user status (activate/deactivate)
   * PATCH /admin/users/:id/status
   * Only accessible by ADMIN
   */
  @Patch('users/:id/status')
  @Roles(Role.ADMIN)
  async updateUserStatus(
    @Param('id') userId: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ): Promise<UserResponseDto> {
    return this.adminService.updateUserStatus(userId, updateUserStatusDto);
  }

  /**
   * Delete a user
   * DELETE /admin/users/:id
   * Only accessible by ADMIN
   */
  @Delete('users/:id')
  @Roles(Role.ADMIN)
  async deleteUser(@Param('id') userId: string): Promise<{ message: string }> {
    return this.adminService.deleteUser(userId);
  }
}
