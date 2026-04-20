import { Injectable } from '@nestjs/common';

@Injectable()
export class OtpHelper {
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  getOtpExpiry(minutes: number = 10): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  isOtpExpired(expiryTime: Date): boolean {
    return new Date() > expiryTime;
  }
}
