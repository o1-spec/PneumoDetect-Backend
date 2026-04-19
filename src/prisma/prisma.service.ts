import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  // Proxy methods
  get $connect() {
    return this.prisma.$connect.bind(this.prisma);
  }

  get $disconnect() {
    return this.prisma.$disconnect.bind(this.prisma);
  }

  get user() {
    return this.prisma.user;
  }

  get patient() {
    return this.prisma.patient;
  }

  get scan() {
    return this.prisma.scan;
  }

  get notification() {
    return this.prisma.notification;
  }

  get loginHistory() {
    return this.prisma.loginHistory;
  }
}
