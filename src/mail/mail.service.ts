import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.EMAIL_PORT || '587', 10);
    const secure = port === 465;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      connectionTimeout: 5000, // 5 seconds connection timeout
      greetingTimeout: 5000,   // 5 seconds greeting timeout
      socketTimeout: 10000,    // 10 seconds socket timeout
      tls: {
        // Prevents handshake validation timeouts inside containerized clouds like Render
        rejectUnauthorized: false,
      },
    });
  }

  async sendOtpEmail(email: string, otp: string): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@pneumodetect.com',
      to: email,
      subject: 'PneumoDetect - Email Verification',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome to PneumoDetect</h2>
          <p>To verify your email address and complete your registration, please use the following OTP:</p>
          <div style="background-color: #f0f0f0; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3 style="text-align: center; letter-spacing: 5px; color: #007AFF;">
              ${otp}
            </h3>
          </div>
          <p><strong>This OTP expires in 10 minutes.</strong></p>
          <p>If you didn't request this verification, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            PneumoDetect Team<br>
            AI-Powered Pneumonia Detection System
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 [MailService] Verification OTP successfully sent to: ${email}`);
    } catch (error) {
      console.error(`❌ [MailService] SMTP email failed to send to ${email}:`, error);

      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction) {
        throw new Error(`Failed to send email: ${error.message}`);
      }

      console.warn(
        `\n==================================================\n` +
        `⚠️  [MailService DEV FALLBACK] SMTP failed.\n` +
        `   🔑 FALLBACK OTP CODE FOR TESTING: ${otp}\n` +
        `==================================================\n`
      );
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@pneumodetect.com',
      to: email,
      subject: 'Welcome to PneumoDetect',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome, ${name}!</h2>
          <p>Your email has been verified successfully. You can now log in to PneumoDetect.</p>
          <p>Ready to detect pneumonia? Log in now:</p>
          <a href="https://pneumodetect.com/login" style="background-color: #007AFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Go to PneumoDetect
          </a>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            PneumoDetect Team<br>
            AI-Powered Pneumonia Detection System
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 [MailService] Welcome email successfully sent to: ${email}`);
    } catch (error) {
      console.error(`❌ [MailService] SMTP welcome email failed to send to ${email}:`, error);

      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction) {
        throw new Error(`Failed to send email: ${error.message}`);
      }

      console.warn(
        `\n==================================================\n` +
        `⚠️  [MailService DEV FALLBACK] SMTP welcome email failed.\n` +
        `   👋 Welcome, ${name}! Account successfully verified.\n` +
        `==================================================\n`
      );
    }
  }

  /**
   * Generic mail sender used for contact/support messages.
   */
  async sendMail(to: string, subject: string, html: string): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@pneumodetect.com',
      to,
      subject,
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 [MailService] Custom email successfully sent to: ${to}`);
    } catch (error) {
      console.error(`❌ [MailService] SMTP custom email failed to send to ${to}:`, error);

      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction) {
        throw new Error(`Failed to send email: ${error.message}`);
      }

      console.warn(
        `\n==================================================\n` +
        `⚠️  [MailService DEV FALLBACK] SMTP custom email failed.\n` +
        `   📝 Subject: ${subject}\n` +
        `==================================================\n`
      );
    }
  }
}
