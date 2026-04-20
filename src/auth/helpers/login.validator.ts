import { UnauthorizedException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordHelper } from './password.helper';

@Injectable()
export class LoginValidator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHelper: PasswordHelper,
  ) {}

  async validateUserExists(email: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  async validateUserVerified(user: any): Promise<void> {
    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }
  }

  async validatePassword(password: string, hash: string): Promise<void> {
    const isPasswordValid = await this.passwordHelper.compare(password, hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
  }

  validateUserActive(user: any): void {
    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }
  }
}
