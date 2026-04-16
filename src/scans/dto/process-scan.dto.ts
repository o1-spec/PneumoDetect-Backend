import { IsOptional, IsString } from 'class-validator';

export class ProcessScanDto {
  @IsOptional()
  @IsString()
  heatmapUrl?: string;
}
