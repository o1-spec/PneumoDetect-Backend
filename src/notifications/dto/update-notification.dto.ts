import { IsBoolean, IsOptional } from 'class-validator';

/**
 * DTO for marking a notification as read
 */
export class UpdateNotificationDto {
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;
}
