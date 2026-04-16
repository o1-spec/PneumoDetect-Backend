import { IsBoolean, IsNotEmpty } from 'class-validator';

/**
 * DTO for marking a notification as read
 */
export class UpdateNotificationDto {
  @IsBoolean()
  @IsNotEmpty()
  read: boolean;
}
