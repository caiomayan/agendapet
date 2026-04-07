import * as authService from "../services/authService.js";
import { loginUsernameValidate } from "../validators/userValidator.js";

export async function login(req, res) {
  try {
    const { username, password } = loginUsernameValidate.parse(req.body);

    const userLogon = await authService.login(username, password);

    return res.status(200).json(userLogon);
  } catch (e) {
    return res.status(401).json({
        message: e.message
    })
  }
}
