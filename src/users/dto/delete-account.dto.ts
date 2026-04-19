import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class DeleteAccountDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
