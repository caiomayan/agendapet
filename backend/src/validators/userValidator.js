import * as z from "zod";

export const idValidate = z.object({
  id: z.uuid("O UUID requisitado não está no formato correto"),
});

export const usernameValidate = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Mínimo de 3 caracteres")
    .max(20, "Máximo de 20 caracteres")
    .regex(
      /^[a-z0-9_.]+$/,
      "O username deve conter apenas letras minúsculas, números, underline e ponto",
    )
    .toLowerCase(),
});

export const userBaseValidate = z.object({
  id: idValidate.shape.id.optional(),
  username: usernameValidate.shape.username,
  email: z.email("E-mail não está no formato correto"),
  name: z.string().min(3).max(100).optional(),
  password: z
    .string()
    .min(8, "Mínimo de 8 caracteres")
    .max(72, "Máximo de 72 caracteres"),
});

export const createUserValidate = userBaseValidate.omit({ id: true });

export const updateUserValidate = userBaseValidate.omit({ id: true }).partial();

export const loginUsernameValidate = userBaseValidate.pick({
  username: true,
  password: true,
});
