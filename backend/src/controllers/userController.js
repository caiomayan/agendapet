import axios from "axios";
import crypto from "crypto";
import * as z from "zod";
import * as userService from "../services/userService.js";
import * as userValidator from "../validators/userValidator.js";

export async function listUserID(req, res) {
  try {
    const { id } = userValidator.idValidate.parse(req.params);
    const listedUser = await userService.getUserID(id);

    if (!listedUser) {
      return res.status(404).json({
        message: `O usuário com este UUID não existe`,
      });
    }

    return res.status(200).json(listedUser);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({
        message: e.issues[0]?.message || "Erro de validação",
      });
    }

    console.error(e);
    return res.status(500).json({
      message: "Erro ao listar usuário desejado",
    });
  }
}

export async function listUserUsername(req, res) {
  try {
    const { username } = userValidator.usernameValidate.parse(req.params);
    const listedUser = await userService.getUserUsername(username);

    if (!listedUser) {
      return res.status(404).json({
        message: `O usuário ${username} não existe`,
      });
    }

    return res.status(200).json(listedUser);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({
        message: e.issues[0]?.message || "Erro de validação",
      });
    }

    console.error(e);
    return res.status(500).json({
      message: "Erro ao listar usuário desejado",
    });
  }
}

export async function listUsers(req, res) {
  try {
    const users = await userService.getUsers();
    res.status(200).json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: "Erro ao buscar lista de usuários",
    });
  }
}

export async function createUser(req, res) {
  try {
    const newUserValidated = userValidator.createUserValidate.parse(req.body);

    if (newUserValidated.password) {
      const sha1Hash = crypto
        .createHash("sha1")
        .update(newUserValidated.password)
        .digest("hex")
        .toUpperCase();

      const leakPassword = await axios.get(
        `https://api.pwnedpasswords.com/range/${sha1Hash.slice(0, 5)}`,
      );

      const leakPasswordResult = leakPassword.data
        .split("\n")
        .some((hash) => hash.startsWith(`${sha1Hash.slice(5)}`));

      if (leakPasswordResult) {
        return res.status(400).json({
          message:
            "A senha desejada não é segura o suficiente, pois há indícios de vazamentos na internet",
        });
      }
    }

    const newUser = await userService.addUser(newUserValidated);

    res.status(201).json(newUser);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({
        error_validator: e.issues.map((issue) => ({
          field: issue.path.join(".") || "body",
          message: issue.message,
        })),
      });
    }

    if (e.code === "23505") {
      return res.status(400).json({
        message: "Nome de usuário ou email já estão em uso",
      });
    }
    console.error(e);
    res.status(500).json({
      message: "Erro ao criar usuário",
    });
  }
}

export async function updateUser(req, res) {
  try {
    const { id } = userValidator.idValidate.parse(req.params);

    const updatedUserValidated = userValidator.updateUserValidate.parse(
      req.body,
    );

    if (id !== req.user.id) {
      return res.status(403).json({
        message: "Você não está autorizado a deletar outros usuários.",
      });
    }

    if (updatedUserValidated.password) {
      const sha1Hash = crypto
        .createHash("sha1")
        .update(updatedUserValidated.password)
        .digest("hex")
        .toUpperCase();

      const leakPassword = await axios.get(
        `https://api.pwnedpasswords.com/range/${sha1Hash.slice(0, 5)}`,
      );

      const leakPasswordResult = leakPassword.data
        .split("\n")
        .some((hash) => hash.startsWith(`${sha1Hash.slice(5)}`));

      if (leakPasswordResult) {
        return res.status(400).json({
          message:
            "A senha desejada não é segura o suficiente, pois há indícios de vazamentos",
        });
      }
    }

    const updatedUser = await userService.updateUser(id, updatedUserValidated);

    if (!updatedUser) {
      return res.status(404).json({
        message: "Usuário não encontrado ou nada para alterar",
      });
    }

    res.status(200).json(updatedUser);
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
    res.status(500).json({
      message: "Erro ao atualizar o usuário",
    });
  }
}

export async function deleteUser(req, res) {
  console.log("Quem está tentando deletar: ", req.user.username);

  try {
    const { id } = userValidator.idValidate.parse(req.params);

    if (req.params.id !== req.user.id) {
      return res.status(403).json({
        message: "Você não está autorizado a deletar outros usuários.",
      });
    }

    const deletedUser = await userService.deleteUser(id);

    if (!deletedUser) {
      return res.status(404).json({
        message: "O usuário a ser removido não existe",
      });
    }

    return res.status(200).json({
      message: `Usuário ${deletedUser.username} foi removido com sucesso`,
    });
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
    return res.status(500).json({
      message: "Erro ao remover usuário",
    });
  }
}
