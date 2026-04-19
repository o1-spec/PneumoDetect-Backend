export class RecentActivityDto {
  id: string;
  type: 'SCAN' | 'NOTIFICATION' | 'PROFILE_UPDATE' | 'LOGIN';
  title: string;
  message: string;
  icon?: string;
  timestamp: Date;
  metadata?: {
    scanId?: string;
    scanResult?: string;
    confidence?: number;
    patientName?: string;
    notificationId?: string;
    notificationType?: string;
    loginId?: string;
    ipAddress?: string;
    userAgent?: string;
    logoutAt?: Date;
    sessionDurationMinutes?: number;
  };
}
