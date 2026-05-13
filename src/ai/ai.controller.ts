import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AiService, PredictionResult } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('ai')
@ApiBearerAuth()
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  /**
   * Health check endpoint for Flask AI service
   * GET /ai/health
   */
  @Get('health')
  @ApiOperation({ summary: 'Check Flask AI service health' })
  @ApiResponse({ status: 200, description: 'AI service is healthy' })
  @ApiResponse({ status: 503, description: 'AI service is down' })
  async checkHealth() {
    const isHealthy = await this.aiService.healthCheck();
    if (!isHealthy) {
      return {
        status: 'DOWN',
        message: 'Flask AI service is not responding',
      };
    }
    return {
      status: 'UP',
      message: 'Flask AI service is running',
    };
  }

  /**
   * Predict pneumonia from image
   * POST /ai/predict
   * Body: { imageUrl: string }
   * Returns: { result: 'PNEUMONIA' | 'NORMAL', confidence: number, rawPrediction: number }
   */
  @Post('predict')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Predict pneumonia from X-ray image',
    description:
      'Sends X-ray image to Flask ML model and returns prediction (PNEUMONIA or NORMAL) with confidence score',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        imageUrl: {
          type: 'string',
          description: 'URL or local path to X-ray image',
          example:
            'https://example.com/xray.jpg or /uploads/xray-uuid.jpg',
        },
      },
      required: ['imageUrl'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Prediction successful',
    schema: {
      example: {
        result: 'PNEUMONIA',
        confidence: 0.95,
        rawPrediction: 0.95,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid image or prediction failed',
  })
  @ApiResponse({
    status: 503,
    description: 'Flask AI service unavailable',
  })
  async predict(
    @Body('imageUrl') imageUrl: string,
    @CurrentUser() user: any,
  ): Promise<PredictionResult> {
    if (!imageUrl) {
      throw new BadRequestException('imageUrl is required');
    }

    this.logger.log(
      `Prediction request from user ${user.id} for image: ${imageUrl}`,
    );

    const prediction = await this.aiService.predictPneumonia(imageUrl);

    this.logger.log(
      `Prediction result: ${prediction.result} (confidence: ${prediction.confidence})`,
    );

    return prediction;
  }

  /**
   * Batch predict multiple images
   * POST /ai/predict-batch
   * Body: { imageUrls: string[] }
   * Returns: Array of predictions
   */
  @Post('predict-batch')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Batch predict multiple X-ray images',
    description: 'Send multiple images for pneumonia prediction',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        imageUrls: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of image URLs or paths',
        },
      },
      required: ['imageUrls'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Batch predictions successful',
    schema: {
      example: [
        { imageUrl: '/uploads/xray1.jpg', result: 'PNEUMONIA', confidence: 0.92 },
        { imageUrl: '/uploads/xray2.jpg', result: 'NORMAL', confidence: 0.88 },
      ],
    },
  })
  async predictBatch(
    @Body('imageUrls') imageUrls: string[],
    @CurrentUser() user: any,
  ) {
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      throw new BadRequestException(
        'imageUrls must be a non-empty array',
      );
    }

    this.logger.log(
      `Batch prediction request from user ${user.id} for ${imageUrls.length} images`,
    );

    const predictions = await Promise.all(
      imageUrls.map(async (imageUrl) => {
        try {
          const prediction = await this.aiService.predictPneumonia(imageUrl);
          return {
            imageUrl,
            ...prediction,
            status: 'SUCCESS',
          };
        } catch (error) {
          return {
            imageUrl,
            status: 'FAILED',
            error: error.message,
          };
        }
      }),
    );

    return {
      total: imageUrls.length,
      successful: predictions.filter((p) => p.status === 'SUCCESS').length,
      failed: predictions.filter((p) => p.status === 'FAILED').length,
      predictions,
    };
  }
}
