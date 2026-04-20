import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SendMessageDto } from './dto/send-message.dto';
import { NotificationType } from '@prisma/client';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Send a contact us message to support and optionally create a confirmation notification
   * If userId is provided (authenticated user), a SYSTEM notification will be created for them.
   */
  async sendMessage(userId: string | null, dto: SendMessageDto): Promise<{ message: string }> {
  const supportEmail = process.env.SUPPORT_EMAIL ?? process.env.EMAIL_USER ?? 'no-reply@example.com';

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 16px;">
        <h3>Contact Us Message</h3>
        <p><strong>Subject:</strong> ${dto.subject}</p>
        <p><strong>Message:</strong></p>
        <div style="white-space: pre-wrap; border-left: 3px solid #eee; padding-left: 12px;">${dto.message}</div>
        <hr />
        <p><strong>Contact Email:</strong> ${dto.contactEmail || 'Not provided'}</p>
        <p><strong>Contact Phone:</strong> ${dto.contactPhone || 'Not provided'}</p>
        <p><strong>UserId:</strong> ${userId || 'Guest'}</p>
      </div>
    `;

    try {
      await this.mailService.sendMail(supportEmail, `PneumoDetect Contact: ${dto.subject}`, html);
    } catch (err) {
      this.logger.error('Failed to send support email', err?.message || err);
      throw err;
    }


    if (userId) {
      try {
        await this.notificationsService.createNotification({
          userId,
          title: 'Message Received',
          message: 'We have received your message to support. Our team will respond via the contact details you provided.',
          type: NotificationType.SYSTEM,
        });
      } catch (err) {

        this.logger.warn('Failed to create confirmation notification', err?.message || err);
      }
    }

    return { message: 'Message sent successfully' };
  }
}
