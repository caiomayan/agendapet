import * as z from "zod";

export const idValidate = z.object({
  id: z.uuid("O ID não está no formato correto"),
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

export const passwordValidate = z.object({
  password: z
    .string()
    .min(8, "Senha com mínimo de 8 caracteres")
    .max(72, "Senha com máximo de 72 caracteres")
    .regex(/[a-z]/, "A senha deve conter ao menos uma letra minúscula")
    .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula")
    .regex(/\d/, "A senha deve conter ao menos um número")
    .regex(
      /[@$!%*?&-]/,
      "A senha deve conter ao menos um caractere especial, exceto ponto e underline",
    ),
});

export const userBaseValidate = z.object({
  id: idValidate.shape.id.optional(),
  username: usernameValidate.shape.username,
  email: z.email("Este e-mail não é válido"),
  name: z
    .string()
    .trim()
    .min(3, "O nome deve conter no mínimo 3 letras")
    .max(100, "O nome deve conter no máximo 100 letras")
    .regex(
      /^[^0-9@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`]+$/,
      "O nome não pode conter números ou caracteres especiais",
    )
    .optional(),
  password: passwordValidate.shape.password,
});

export const createUserValidate = userBaseValidate.omit({ id: true });

export const updateUserValidate = userBaseValidate.omit({ id: true }).partial();

export const loginUsernameValidate = userBaseValidate.pick({
  username: true,
  password: true,
});

export const loginEmailValidate = userBaseValidate.pick({
  email: true,
  password: true,
});

export const verifyOtpValidate = z.object({
  code: z
    .string()
    .length(6, "Código 2FA deve conter 6 dígitos")
    .regex(/^\d{6}$/, "Código 2FA deve conter apenas números"),
  email: userBaseValidate.shape.email,
});
