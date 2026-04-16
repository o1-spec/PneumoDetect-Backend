import { IsEmail, IsString, MinLength, IsOptional, IsPhoneNumber } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, {
    message: 'Password must be at least 8 characters long',
  })
  password: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;
}
