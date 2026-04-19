import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendOtpEmail(email: string, otp: string): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_USER,
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
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_USER,
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
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Generic mail sender used for contact/support messages.
   */
  async sendMail(to: string, subject: string, html: string): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}
