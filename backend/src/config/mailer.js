import "dotenv/config";
import nodemailer from "nodemailer";

// usando gmail my.account / app passwords

export const transport = nodemailer.createTransport({
  host: process.env.GMAIL_HOST,
  port: process.env.GMAIL_PORT,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

export async function sendOtpEmail(to, code) {
  await transport.sendMail({
    from: "noreply@agendapet.com",
    to: to,
    subject: `Código de verificação ${code}`,
    text: `Seu código de verificação é: ${code}`,
  });
}
