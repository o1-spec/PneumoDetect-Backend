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
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ScansService } from './scans.service';
import { CreateScanDto } from './dto/create-scan.dto';
import { ProcessScanDto } from './dto/process-scan.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

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
   * GET /scans/patient/:patientId
   * Get all scans for a specific patient
   * - Only allows doctor who created scans for that patient or admin
   * - Includes patient and doctor info
   * - Ordered by newest first
   */
  @Get('patient/:patientId')
  async getScansByPatient(
    @Param('patientId') patientId: string,
    @CurrentUser() user: any,
  ) {
    const scans = await this.scansService.getScansByPatient(
      patientId,
      user.id,
      user.role,
    );

    return {
      count: scans.length,
      patientId,
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

  /**
   * GET /scans/my-scans
   * Get all scans for the authenticated patient
   * - Only accessible by PATIENT role
   * - Returns patient-safe fields only
   * - Includes filtering and pagination support
   */
  @Get('patient/my-scans/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PATIENT')
  async getMyScans(
    @CurrentUser() user: any,
  ) {
    const scans = await this.scansService.getScansByPatientUser(user.id);

    return {
      count: scans.length,
      scans,
    };
  }

  /**
   * GET /scans/:id/patient-view
   * Get a specific scan with patient-limited fields
   * - Only accessible by PATIENT role
   * - Patient can only view their own scans
   * - Returns patient-safe fields with recommendations
   */
  @Get('patient/:scanId/view')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PATIENT')
  async getPatientScanView(
    @Param('scanId') scanId: string,
    @CurrentUser() user: any,
  ) {
    const scan = await this.scansService.getScanByIdPatientView(scanId, user.id);

    return {
      scan,
    };
  }

  /**
   * PATCH /scans/:id/notes
   * Patient adds or updates personal notes on their scan
   * - Only accessible by PATIENT role
   * - Patient can only edit notes on their own scans
   */
  @Patch('patient/:scanId/notes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PATIENT')
  async updateScanNotes(
    @Param('scanId') scanId: string,
    @Body('notes') notes: string,
    @CurrentUser() user: any,
  ) {
    const scan = await this.scansService.updatePatientNotes(scanId, notes, user.id);

    return {
      message: 'Notes updated successfully',
      scan,
    };
  }

  /**
   * PATCH /scans/:id
   * Update scan notes or result
   * - Only allows owner doctor or admin
   */
  @Patch(':id')
  async updateScan(
    @Param('id') scanId: string,
    @Body() updateScanDto: { result?: string; notes?: string },
    @CurrentUser() user: any,
  ) {
    const scan = await this.scansService.updateScan(
      scanId,
      updateScanDto,
      user.id,
      user.role,
    );

    return {
      message: 'Scan updated successfully',
      scan,
    };
  }
}

