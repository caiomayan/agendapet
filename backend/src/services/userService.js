import bcrypt from "bcrypt";
import pool from "../config/database.js";

export async function getUserLogin(username) {
  const query = await pool.query(
    "SELECT id, username, name, email, password FROM users WHERE username = $1",
    [username],
  );

  return query.rows[0];
}

export async function getEmailLogin(email) {
  const query = await pool.query(
    "SELECT id, username, name, email, password FROM users WHERE email = $1",
    [email],
  );

  return query.rows[0];
}

export async function getUserUsername(username) {
  const query = await pool.query(
    "SELECT id, username, name FROM users WHERE username = $1",
    [username],
  );

  return query.rows[0];
}

export async function getUserID(id) {
  const query = await pool.query("SELECT * FROM users WHERE id = $1", [id]);

  return query.rows[0];
}

export async function getUsers() {
  const query = await pool.query("SELECT * FROM users");

  return query.rows;
}

export async function addUser(user) {
  const { username, password, email, name = null } = user;

  // Bcrypt
  const passwordHash = await bcrypt.hash(password, 10);

  // Consulta

  const query = await pool.query(
    `
    INSERT INTO users (username, password, email, name)
    VALUES ($1, $2, $3, $4)
    RETURNING id, username, email, name, created_at;
  `,
    [username, passwordHash, email, name],
  );

  return query.rows[0];
}

export async function updateUser(id, user) {
  const fields = [];
  const values = [];
  let queryString = "UPDATE users SET ";

  // Tratamento especial
  if (user.password) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    fields.push(`password = $${fields.length + 1}`);
    values.push(passwordHash);
  }

  // Tratamento comum para os outros campos
  const allowedFields = ["username", "email", "name"];

  for (const field of allowedFields) {
    if (user[field] !== undefined) {
      fields.push(`${field} = $${fields.length + 1}`);
      values.push(user[field]);
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  queryString +=
    fields.join(", ") +
    ` WHERE id = $${values.length} RETURNING id, username, email, name, updated_at;`;

  const query = await pool.query(queryString, values);
  return query.rows[0];
}

export async function deleteUser(id) {
  const query = await pool.query(
    `DELETE FROM users WHERE id = $1 RETURNING username;`,
    [id],
  );
  return query.rows[0];
}
