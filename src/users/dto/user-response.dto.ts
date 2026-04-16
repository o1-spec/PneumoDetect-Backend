import { Role } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class UserResponseDto {
  id: string;
  email: string;
  name: string;
  role: Role;
  specialization: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  password?: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
