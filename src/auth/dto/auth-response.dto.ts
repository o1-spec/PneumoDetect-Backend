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
  createdAt: Date;
  accessToken: string;
}
