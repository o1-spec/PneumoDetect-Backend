import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';

export interface PredictionResult {
  result: 'PNEUMONIA' | 'NORMAL';
  confidence: number;
  rawPrediction: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private flaskApiUrl: string;

  constructor(private configService: ConfigService) {
    this.flaskApiUrl =
      this.configService.get<string>('FLASK_API_URL') ||
      'http://127.0.0.1:5000';
    this.logger.log(`Flask API URL configured: ${this.flaskApiUrl}`);
  }

  /**
   * Send image to Flask ML model for prediction
   * @param imagePath - Local file path or URL to the X-ray image
   * @returns Prediction result with PNEUMONIA/NORMAL and confidence score
   */
  async predictPneumonia(imagePath: string): Promise<PredictionResult> {
    try {
      const imageStream = this.isUrl(imagePath)
        ? await this.downloadImage(imagePath)
        : fs.createReadStream(imagePath);

      const formData = new FormData();
      formData.append('file', imageStream);

      const config = {
        headers: formData.getHeaders(),
        timeout: 30000, // 30 seconds timeout
      };

      // Send to Flask API
      const response = await axios.post(
        `${this.flaskApiUrl}/predict`,
        formData,
        config,
      );

      const prediction = response.data;

      if (!prediction.result || prediction.confidence === undefined) {
        throw new Error('Invalid prediction response from Flask');
      }

      return {
        result: prediction.result,
        confidence: prediction.confidence,
        rawPrediction: prediction.raw_prediction,
      };
    } catch (error) {
      this.logger.error(
        `Error during prediction: ${error.message}`,
        error.stack,
      );

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new BadRequestException(
            'Flask AI service is not running. Make sure to start the Flask server.',
          );
        }
        if (error.response?.status === 400) {
          throw new BadRequestException(
            error.response.data.error || 'Invalid image file',
          );
        }
      }

      throw new BadRequestException(
        `Prediction failed: ${error.message}`,
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.flaskApiUrl}/`, {
        timeout: 5000,
      });
      this.logger.log('Health check passed');
      return response.status === 200;
    } catch (error) {
      this.logger.warn(`Health check failed: ${error.message}`);
      return false;
    }
  }

  private isUrl(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }
  private downloadImage(
    imageUrl: string,
  ): Promise<NodeJS.ReadableStream> {
    return new Promise((resolve, reject) => {
      const protocol = imageUrl.startsWith('https') ? https : http;

      const request = protocol.get(imageUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(`Failed to download image: ${response.statusCode}`),
          );
          return;
        }
        resolve(response);
      });

      request.on('error', reject);
    });
  }
}
