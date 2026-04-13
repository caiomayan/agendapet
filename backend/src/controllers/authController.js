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
    return res.status(401).json({
      message: e.message,
    });
  }
}

export async function verifyOtp(req, res) {
  try {
    const userLogon = await authService.verifyOtp(
      req.body.email,
      req.body.code,
    );

    return res.status(200).json(userLogon);
  } catch (e) {
    return res.status(401).json({
      message: e.message,
    });
  }
}
