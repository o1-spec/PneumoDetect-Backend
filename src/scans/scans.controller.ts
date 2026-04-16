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
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ScansService } from './scans.service';
import { CreateScanDto } from './dto/create-scan.dto';
import { ProcessScanDto } from './dto/process-scan.dto';

// Multer storage configuration for local disk uploads
const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomstring.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter to only accept image uploads
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

  /**
   * POST /scans/upload
   * Upload a chest X-ray image and create a scan record
   * - Accepts multipart/form-data with 'image' field
   * - Accepts patientId in body
   * - Saves image locally in ./uploads directory
   * - Creates Scan record in database with UPLOADED status
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('image', {
      storage,
      fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
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

    // Construct relative path to image
    const imageUrl = `/uploads/${file.filename}`;

    // Create scan record in database
    const scan = await this.scansService.createScan(
      createScanDto,
      imageUrl,
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
