import * as z from "zod";
import * as authService from "../services/authService.js";
import * as userValidator from "../validators/userValidator.js";

export async function login(req, res) {
  try {
    const { email, password } = userValidator.loginEmailValidate.parse(
      req.body,
    );

    const userVerifyLogon = await authService.loginEmail(email, password);

    return res.status(200).json(userVerifyLogon);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({
        error_validator: e.issues.map((issue) => ({
          field: issue.path.join(".") || "body",
          message: issue.message,
        })),
      });
    }

    console.error(e);

    if (e.code.includes("ETIMEDOUT")) {
      return res.status(503).json({
        message: "Serviço de e-mail indisponível",
      });
    }

    switch (e.message) {
      case "Usuário inválido":
        return res.status(401).json({
          message: e.message,
        });
      case "Código 2FA não encontrado":
        return res.status(401).json({
          message: e.message,
        });
      case "Login inválido":
        return res.status(401).json({
          message: e.message,
        });
    }

    return res.status(500).json({
      message: e.message,
    });
  }
}

export async function verifyOtp(req, res) {
  try {
    const { email, code } = userValidator.verifyOtpValidate.parse(req.body);
    const userLogon = await authService.verifyOtp(email, code);

    return res.status(200).json(userLogon);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({
        error_validator: e.issues.map((issue) => ({
          field: issue.path.join(".") || "body",
          message: issue.message,
        })),
      });
    }

    console.error(e);

    return res.status(401).json({
      message: e.message,
    });
  }
}
