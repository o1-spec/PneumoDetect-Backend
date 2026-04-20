import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class DataValidator {
  validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }
  }

  validatePassword(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long',
      );
    }

    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one uppercase letter',
      );
    }

    if (!/[0-9]/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one number',
      );
    }
  }

  validatePhoneNumber(phone: string): void {
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s]?[0-9]{3}[-\s]?[0-9]{4,6}$/;
    if (!phoneRegex.test(phone)) {
      throw new BadRequestException('Invalid phone number format');
    }
  }

  validatePaginationParams(page: number, pageSize: number): void {
    if (page < 1) {
      throw new BadRequestException('Page must be greater than 0');
    }

    if (pageSize < 1 || pageSize > 100) {
      throw new BadRequestException('PageSize must be between 1 and 100');
    }
  }

  validateId(id: string): void {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new BadRequestException('Invalid ID provided');
    }
  }
}
