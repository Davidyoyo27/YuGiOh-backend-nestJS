import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as ejs from 'ejs';
import { join } from 'path';
import { readFileSync } from 'fs';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,   // Ej: smtp.gmail.com
      port: Number(process.env.MAIL_PORT) || 465,
      secure: true, // Gmail usa SSL puerto 465
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendMail(to: string, subject: string, template: string, context: any) {
    // Ruta del archivo .ejs dentro de /templates
    const templatePath = join(__dirname, 'templates', `${template}.ejs`);
    const htmlTemplate = readFileSync(templatePath, 'utf8');
    const html = ejs.render(htmlTemplate, context);

    const mailOptions = {
      from: process.env.MAIL_FROM || '"No Reply" <noreply@example.com>',
      to,
      subject,
      html,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
