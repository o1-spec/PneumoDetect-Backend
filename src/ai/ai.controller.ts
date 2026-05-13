import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AiService, PredictionResult } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('ai')
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('health')
  @ApiOperation({ summary: 'Check Flask service health' })
  @ApiResponse({ status: 200, description: 'Service healthy' })
  @ApiResponse({ status: 503, description: 'Service down' })
  async checkHealth() {
    const isHealthy = await this.aiService.healthCheck();
    if (!isHealthy) {
      return {
        status: 'DOWN',
        message: 'Service is not responding',
      };
    }
    return {
      status: 'UP',
      message: 'Service is running',
    };
  }

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

    const prediction = await this.aiService.predictPneumonia(imageUrl);

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
