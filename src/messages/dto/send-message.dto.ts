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


  @IsOptional()
  @IsEmail()
  contactEmail?: string;


  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;
}
