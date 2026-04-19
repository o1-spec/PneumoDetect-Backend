import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(
    fileBuffer: Buffer,
    fileName: string,
    folder: string = 'pneumodetect',
  ): Promise<{ secure_url: string; public_id: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          public_id: fileName,
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          } else {
            reject(new Error('Upload failed: No result returned'));
          }
        },
      );

      const readable = Readable.from(fileBuffer);
      readable.pipe(uploadStream);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async getImageUrl(publicId: string): Promise<string> {
    return cloudinary.url(publicId, {
      secure: true,
      fetch_format: 'auto',
      quality: 'auto',
    });
  }
}
