import bcrypt from "bcrypt";
import crypto from "crypto";
import "dotenv/config";
import jwt from "jsonwebtoken";
import pool from "../config/database.js";
import * as mailer from "../config/mailer.js";
import * as userService from "../services/userService.js";

export async function loginUsername(username, password) {
  const userExists = await userService.getUserLogin(username);
  if (!userExists) {
    throw new Error("Usuário inválido");
  }

  const passwordExists = await bcrypt.compare(password, userExists.password);
  if (!passwordExists) {
    throw new Error("Senha inválida");
  }

  const payload = {
    id: userExists.id,
    username: userExists.username,
    email: userExists.email,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  const { password: _, ...userWithoutPassword } = userExists;

  return {
    user: userWithoutPassword,
    token,
  };
}

export async function loginEmail(email, password) {
  const userExists = await userService.getEmailLogin(email);
  if (!userExists) {
    throw new Error("Usuário inválido");
  }

  const passwordExists = await bcrypt.compare(password, userExists.password);
  if (!passwordExists) {
    throw new Error("Senha inválida");
  }

  const otp = crypto.randomInt(100000, 999999).toString();

  const otpHash = await bcrypt.hash(otp, 10);

  const expires = new Date(Date.now() + 10 * 60 * 1000);

  await pool.query(
    "INSERT INTO otp_tokens (user_id, code, expires_at) VALUES ($1, $2, $3)",
    [userExists.id, otpHash, expires],
  );

  await mailer.sendOtpEmail(email, otp);

  return {
    message: "Código de verificação enviado para o seu e-mail",
  };
}

export async function verifyOtp(email, code) {
  const queryUserEmail = await pool.query(
    "SELECT id, username, email FROM users WHERE email = $1",
    [email],
  );

  if (!queryUserEmail.rows[0]) {
    throw new Error("Usuário inválido");
  }

  const querySearch = await pool.query(
    "SELECT code, expires_at FROM otp_tokens WHERE user_id = $1 ORDER BY expires_at DESC LIMIT 1",
    [queryUserEmail.rows[0].id],
  );

  if (!querySearch.rows[0]) {
    throw new Error("Código 2FA não encontrado");
  }

  const otpDecoded = await bcrypt.compare(code, querySearch.rows[0].code);

  if (
    otpDecoded &&
    new Date(querySearch.rows[0].expires_at) > new Date()
  ) {
    await pool.query("DELETE FROM otp_tokens WHERE user_id = $1", [
      queryUserEmail.rows[0].id,
    ]);

    const payload = {
      id: queryUserEmail.rows[0].id,
      username: queryUserEmail.rows[0].username,
      email: queryUserEmail.rows[0].email,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const { password: _, ...userWithoutPassword } = queryUserEmail.rows[0];

    return {
      user: userWithoutPassword,
      token,
    };
  } else {
    throw new Error("Código 2FA é inválido");
  }
}
