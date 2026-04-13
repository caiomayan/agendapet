import "dotenv/config";
import nodemailer from "nodemailer";

// mailtrap

export const transport = nodemailer.createTransport({
  host: process.env.GMAIL_HOST,
  port: process.env.GMAIL_PORT,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function sendOtpEmail(to, code) {
  await transport.sendMail({
    from: "noreply@agendapet.com",
    to: to,
    subject: `Código de verificação ${code}`,
    text: `Seu código de verificação é: ${code}`,
  });
}
