import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ScansService } from './scans.service';
import { CreateScanDto } from './dto/create-scan.dto';
import { ProcessScanDto } from './dto/process-scan.dto';

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException('Only JPG, JPEG, and PNG files are allowed'),
      false,
    );
  }
};

@Controller('scans')
@UseGuards(JwtAuthGuard)
export class ScansController {
  constructor(private scansService: ScansService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async uploadScan(
    @UploadedFile() file: Express.Multer.File,
    @Body() createScanDto: CreateScanDto,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    const scan = await this.scansService.createScan(
      createScanDto,
      file.buffer,
      file.originalname,
      user.id,
    );

    return {
      message: 'Scan uploaded successfully',
      scan,
    };
  }

  /**
   * POST /scans/:id/process
   * Process a scan with mock AI results
   * - Simulates AI inference
   * - Updates scan with result (PNEUMONIA/NORMAL) and confidence score
   * - Only allows owner doctor or admin
   */
  @Post(':id/process')
  async processScan(
    @Param('id') scanId: string,
    @Body() processScanDto: ProcessScanDto,
    @CurrentUser() user: any,
  ) {
    const scan = await this.scansService.processScan(
      scanId,
      user.id,
      user.role,
      processScanDto,
    );

    return {
      message: 'Scan processed successfully',
      scan,
    };
  }

  /**
   * GET /scans
   * Get scan history for current user
   * - If user is ADMIN: returns all scans
   * - If user is DOCTOR: returns only their scans
   * - Includes patient and doctor info
   * - Ordered by newest first
   */
  @Get()
  async getScanHistory(@CurrentUser() user: any) {
    const scans = await this.scansService.getScansByDoctor(user.id, user.role);

    return {
      count: scans.length,
      scans,
    };
  }

  /**
   * GET /scans/:id
   * Get a single scan by ID
   * - Only allows owner doctor or admin
   * - Includes full patient and doctor info
   */
  @Get(':id')
  async getScan(@Param('id') scanId: string, @CurrentUser() user: any) {
    const scan = await this.scansService.getScanById(
      scanId,
      user.id,
      user.role,
    );

    return {
      scan,
    };
  }
}
