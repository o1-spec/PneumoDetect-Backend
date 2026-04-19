export class RecentActivityDto {
  id: string;
  type: 'SCAN' | 'NOTIFICATION' | 'PROFILE_UPDATE';
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
  };
}
