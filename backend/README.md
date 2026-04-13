# Backend da API

API em Node.js para o sistema de login da disciplina de Segurança da Informação.

## Base da API

Todos os endpoints usam a base:

`/api`

## Autenticação

O login é feito em 2 etapas:

1. O usuário envia e-mail e senha.
2. A API envia um código de 2FA por e-mail.
3. O usuário envia o código recebido.
4. Se estiver correto, a API retorna o token JWT.

## Endpoints

### `POST /api/auth/login`

Inicia o login e envia o código de verificação por e-mail.

Body:

```json
{
  "email": "usuario@exemplo.com",
  "password": "SenhaForte@123"
}
```

Resposta de sucesso:

```json
{
  "message": "Código de verificação enviado para o seu e-mail"
}
```

### `POST /api/auth/verify-2fa`

Confirma o código recebido por e-mail e libera o acesso.

Body:

```json
{
  "email": "usuario@exemplo.com",
  "code": "123456"
}
```

Resposta de sucesso:

```json
{
  "user": {
    "id": "uuid-do-usuario",
    "username": "usuario",
    "email": "usuario@exemplo.com"
  },
  "token": "jwt-gerado-pela-api"
}
```

### `POST /api/users`

Cadastra um novo usuário.

Body:

```json
{
  "username": "usuario",
  "email": "usuario@exemplo.com",
  "name": "Nome do Usuario",
  "password": "SenhaForte@123"
}
```

### `PATCH /api/users/id/:id`

Atualiza o cadastro do usuário logado.

Headers:

```text
Authorization: Bearer SEU_TOKEN_JWT
```

### `DELETE /api/users/id/:id`

Remove o usuário logado.

Headers:

```text
Authorization: Bearer SEU_TOKEN_JWT
```

### `GET /api/users`

Lista usuários. Requer token.

Headers:

```text
Authorization: Bearer SEU_TOKEN_JWT
```

## Regras de senha

A senha precisa ter:

- pelo menos 8 caracteres
- letra minúscula
- letra maiúscula
- número
- caractere especial

Se a senha já tiver aparecido em vazamentos, a API rejeita o cadastro ou a alteração.

## Respostas de erro comuns

```json
{
  "message": "Erro"
}
```

```json
{
  "error_validator": [
    {
      "field": "email",
      "message": "E-mail inválido"
    }
  ]
}
```

## Banco de dados

A aplicação usa PostgreSQL.

Tabelas principais:

- `users`
- `otp_tokens`

## Variáveis de ambiente

Exemplo:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=senha
DB_NAME=agendapet
JWT_SECRET=uma_chave_secreta
GMAIL_HOST=smtp.gmail.com
GMAIL_PORT=587
GMAIL_USER=seuemail@gmail.com
GMAIL_PASS=sua_senha_de_app
```

## Observação para o front

No login, a interface precisa ter duas etapas:

1. E-mail e senha.
2. E-mail e código de 6 dígitos.

Depois do `verify-2fa`, use o `token` retornado para chamar as rotas protegidas.
