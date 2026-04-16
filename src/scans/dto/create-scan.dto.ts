import { IsString, IsNotEmpty } from 'class-validator';

export class CreateScanDto {
  @IsString()
  @IsNotEmpty()
  patientId: string;
}
