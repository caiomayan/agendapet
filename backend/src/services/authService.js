import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"
import "dotenv/config"
import * as userService from "../services/userService.js"

export async function login (username, password) {
    const userExists = await userService.getUserLogin(username);
    if (!userExists) {
        throw new Error("Usuário inválido")
    };

    const passwordExists = await bcrypt.compare(password, userExists.password);
    if (!passwordExists) {
        throw new Error("Senha inválida")
    }

    const payload = {
        id: userExists.id,
        username: userExists.username
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1d"
    })

    const { password: _, ...userWithoutPassword} = userExists;

    return {
        user: userWithoutPassword,
        token
    }
}