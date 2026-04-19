import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   * POST /auth/register
   */
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  /**
   * Login a user
   * POST /auth/login
   */
  @Post('login')
  @ApiOperation({ summary: 'Login user and get JWT token' })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns JWT token',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  /**
   * Get current user profile (requires JWT)
   * GET /auth/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access_token')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  async getProfile(@CurrentUser() user: any): Promise<AuthResponseDto> {
    return this.authService.getProfile(user.id);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify user email with OTP' })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: {
      properties: {
        message: { type: 'string' },
        user: { type: 'object' },
        accessToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired OTP',
  })
  @ApiResponse({
    status: 401,
    description: 'User not found',
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp);
  }

  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend OTP to user email' })
  @ApiResponse({
    status: 200,
    description: 'OTP resent successfully',
    schema: {
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'User already verified or invalid request',
  })
  @ApiResponse({
    status: 401,
    description: 'User not found',
  })
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return this.authService.resendOtp(resendOtpDto.email);
  }
}
