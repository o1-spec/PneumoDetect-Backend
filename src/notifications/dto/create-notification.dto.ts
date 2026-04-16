import { IsString, IsEnum, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { NotificationType } from '@prisma/client';

/**
 * DTO for creating a new notification
 * Used for admin/system to create notifications for users
 */
export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(500)
  message: string;

  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
