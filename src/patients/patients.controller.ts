import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto, LinkPatientUserDto } from './dto/create-patient.dto';
import { PatientResponseDto } from './dto/patient-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  /**
   * Create a new patient
   * POST /patients
   * Body: { idNumber, name, age, gender }
   */
  @Post()
  async createPatient(
    @Body() createPatientDto: CreatePatientDto,
  ): Promise<PatientResponseDto> {
    return this.patientsService.createPatient(createPatientDto);
  }

  /**
   * Get all patients
   * GET /patients
   */
  @Get()
  async getAllPatients(): Promise<PatientResponseDto[]> {
    return this.patientsService.getAllPatients();
  }

  /**
   * Get a specific patient by ID
   * GET /patients/:id
   * Query parameter: ?includeScans=true (optional)
   */
  @Get(':id')
  async getPatientById(
    @Param('id') patientId: string,
    @Query('includeScans') includeScans: string = 'false',
  ): Promise<PatientResponseDto | any> {

    const shouldIncludeScans = includeScans === 'true';
    return this.patientsService.getPatientById(patientId, shouldIncludeScans);
  }

  /**
   * Update patient information
   * PATCH /patients/:id
   * Body: { name?, age?, gender? }
   * Note: idNumber cannot be updated (immutable)
   */
  @Patch(':id')
  async updatePatient(
    @Param('id') patientId: string,
    @Body() updatePatientDto: Partial<CreatePatientDto>,
  ): Promise<PatientResponseDto> {
    return this.patientsService.updatePatient(patientId, updatePatientDto);
  }

  /**
   * Delete a patient
   * DELETE /patients/:id
   * WARNING: Cascades to delete related scans
   */
  @Delete(':id')
  async deletePatient(
    @Param('id') patientId: string,
  ): Promise<{ message: string }> {
    return this.patientsService.deletePatient(patientId);
  }

  /**
   * Link a patient record to a registered user account
   * PATCH /patients/:id/link-user
   * Body: { userId } - the User.id of the PATIENT-role user to link
   * Restricted to ADMIN only
   */
  @Patch(':id/link-user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async linkPatientUser(
    @Param('id') patientId: string,
    @Body() linkDto: LinkPatientUserDto,
  ): Promise<PatientResponseDto> {
    return this.patientsService.linkPatientUser(patientId, linkDto.userId);
  }
}
