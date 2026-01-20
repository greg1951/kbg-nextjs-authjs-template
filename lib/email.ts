import nodemailer from 'nodemailer';

export const mailer = nodemailer.createTransport({
  host: 'smtp.resend.com',
  secure: false,
  port: 587,
  auth: {
    user: 'resend',
    pass: process.env.RESEND_API_KEY,
  }
})