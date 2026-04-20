import { Injectable } from '@nestjs/common';

@Injectable()
export class DateHelper {
  getToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  getTodayEnd(): Date {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  }

  getLastNDays(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  formatDate(date: Date, format: 'YYYY-MM-DD' | 'MM-DD-YYYY' = 'YYYY-MM-DD'): string {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();

    if (format === 'MM-DD-YYYY') {
      return `${month}-${day}-${year}`;
    }

    return `${year}-${month}-${day}`;
  }

  getDaysBetween(startDate: Date, endDate: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay);
  }
}
