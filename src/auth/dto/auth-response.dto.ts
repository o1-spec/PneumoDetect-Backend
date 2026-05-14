import { Role } from '@prisma/client';

export class AuthResponseDto {
  id: string;
  email: string;
  name: string;
  role: Role;
  specialization?: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  isVerified?: boolean;
  onboardingCompleted: boolean;
  createdAt: Date;
  accessToken: string;
}
