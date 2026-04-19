import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  subject: string;

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  message: string;

  // Optional contact email so guests can provide a way to be reached
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  // Optional phone number or other contact hint
  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;
}
