# Backend da API

API em Node.js para o sistema de autenticação da disciplina de Segurança da Informação.

O fluxo principal usa login em duas etapas com senha + 2FA por e-mail, retornando um JWT após a confirmação do código.

## Visão Geral

- Base de todos os endpoints: `/api`
- Banco: PostgreSQL
- Autenticação: JWT no header `Authorization: Bearer <token>`
- 2FA: código de 6 dígitos enviado por e-mail
- Validações: feitas com `zod`
- Proteções extras: `helmet`, rate limit no login e consulta de senha vazada via Have I Been Pwned

## Requisitos

- Node.js 18+ recomendado
- PostgreSQL 13+ recomendado
- Uma conta SMTP para envio do código de verificação

## Como Rodar Localmente

1. Instale as dependências.

```bash
npm install
```

2. Configure o arquivo `.env` na pasta `backend`.

3. Importe o schema do banco no PostgreSQL.

4. Inicie a API.

```bash
node server.js
```

Se quiser usar `nodemon`, você pode instalar e criar um script depois, mas o projeto atual sobe com `node server.js`.

## Banco de Dados e pgAdmin

O schema está em [agendapet-schema.sql](agendapet-schema.sql).

### Passo a passo no pgAdmin

1. Crie um banco vazio, por exemplo `agendapet`.
2. Abra o Query Tool desse banco.
3. Se o Postgres reclamar de `gen_random_uuid()`, rode antes:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

4. Execute o conteúdo de [agendapet-schema.sql](agendapet-schema.sql).
5. Confirme se as tabelas `users` e `otp_tokens` foram criadas.

### Estrutura principal do schema

- `users`: dados do usuário cadastrado
- `otp_tokens`: códigos 2FA gerados para login

### Observações sobre o schema

- `users.id` e `otp_tokens.id` usam `gen_random_uuid()`
- `otp_tokens.user_id` tem `ON DELETE CASCADE`
- `otp_tokens.code` guarda o hash do OTP, não o código puro
- `expires_at` define a validade do código
- Códigos 2FA não usados ficam na tabela até serem validados ou expirarem; a limpeza preventiva ainda não é automática

## Variáveis de Ambiente

Exemplo de `.env`:

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

### O que cada variável faz

- `PORT`: porta da API
- `DB_*`: conexão com o PostgreSQL
- `JWT_SECRET`: assinatura do token JWT
- `GMAIL_*`: credenciais SMTP usadas para enviar o OTP por e-mail

## Fluxo de Autenticação

1. O frontend envia e-mail e senha para `POST /api/auth/login`.
2. Se estiver tudo certo, a API gera um OTP de 6 dígitos e envia por e-mail.
3. O frontend exibe a tela de verificação 2FA.
4. O usuário informa e-mail e código recebido em `POST /api/auth/verify-2fa`.
5. Se o código estiver correto e válido, a API retorna o JWT e os dados do usuário.

## Endpoints

### Health Check

#### `GET /api/health`

Retorna se a API está online.

Resposta:

```json
{
  "status": "Ok"
}
```

### Autenticação

#### `POST /api/auth/login`

Inicia o login e envia o código de verificação por e-mail.

Rate limit:

- 6 tentativas a cada 15 minutos por IP

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

Erros possíveis:

- `400` com `error_validator` quando a validação falha
- `401` com `message` quando e-mail ou senha são inválidos
- `401` quando ocorrer falha interna no fluxo de login
- `429` quando exceder o rate limit

#### `POST /api/auth/verify-2fa`

Confirma o código recebido por e-mail e libera o acesso.

Rate limit:

- 6 tentativas a cada 15 minutos por IP

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

Erros possíveis:

- `400` com `error_validator` quando e-mail ou código são inválidos
- `401` com `message` quando o usuário, o código ou a validade do OTP falham
- `429` quando exceder o rate limit

### Usuários

#### `POST /api/users`

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

Resposta de sucesso:

```json
{
  "id": "uuid-do-usuario",
  "username": "usuario",
  "email": "usuario@exemplo.com",
  "name": "Nome do Usuario",
  "created_at": "2026-04-13T12:00:00.000Z"
}
```

Erros possíveis:

- `400` com `error_validator` para falhas de validação
- `400` quando username ou e-mail já estiverem em uso
- `400` quando a senha for considerada insegura por vazamento conhecido
- `500` para falha inesperada

#### `GET /api/users`

Lista todos os usuários.

Header obrigatório:

```text
Authorization: Bearer SEU_TOKEN_JWT
```

Resposta de sucesso:

```json
[
  {
    "username": "usuario",
    "name": "Nome"
  }
]
```

Observação:

- A implementação atual retorna apenas `username` e `name` nessa rota.

#### `GET /api/users/:username`

Busca um usuário pelo username.

Exemplo:

```text
/api/users/usuario
```

Resposta de sucesso:

```json
{
  "id": "uuid",
  "username": "usuario",
  "name": "Nome"
}
```

Erros possíveis:

- `400` para username inválido
- `404` quando o usuário não existir

#### `GET /api/users/id/:id`

Busca um usuário pelo UUID.

Header obrigatório:

```text
Authorization: Bearer SEU_TOKEN_JWT
```

Exemplo:

```text
/api/users/id/550e8400-e29b-41d4-a716-446655440000
```

Resposta de sucesso:

```json
{
  "id": "uuid",
  "name": "Nome",
  "username": "usuario",
  "email": "usuario@exemplo.com",
  "created_at": "2026-04-13T12:00:00.000Z"
}
```

Observação:

- Esta rota retorna dados do próprio usuário autenticado e não inclui senha.

Erros possíveis:

- `400` para UUID inválido
- `401` se não enviar token
- `403` se o token for inválido ou expirado
- `404` se o usuário não existir

#### `PATCH /api/users/id/:id`

Atualiza o cadastro do usuário logado.

Header obrigatório:

```text
Authorization: Bearer SEU_TOKEN_JWT
```

Body possível:

```json
{
  "username": "novo_usuario",
  "email": "novo@email.com",
  "name": "Novo Nome",
  "password": "NovaSenha@123"
}
```

Resposta de sucesso:

```json
{
  "id": "uuid",
  "username": "novo_usuario",
  "email": "novo@email.com",
  "name": "Novo Nome",
  "updated_at": "2026-04-13T12:00:00.000Z"
}
```

Regras do frontend:

- O `id` da rota precisa ser o mesmo `id` do JWT
- Se o usuário tentar atualizar outro ID, a API responde `403`

Erros possíveis:

- `400` com `error_validator` para campos inválidos
- `400` quando a senha for considerada insegura por vazamento conhecido
- `401` se não enviar token
- `403` se o token não corresponder ao `id` da rota
- `404` quando não houver alterações ou o usuário não existir

#### `DELETE /api/users/id/:id`

Remove o usuário logado.

Header obrigatório:

```text
Authorization: Bearer SEU_TOKEN_JWT
```

Regra de acesso:

- O `id` da rota precisa ser o mesmo `id` do JWT

Resposta de sucesso:

```json
{
  "message": "Usuário usuario foi removido com sucesso"
}
```

Erros possíveis:

- `400` para UUID inválido
- `401` se não enviar token
- `403` se tentar remover outro usuário
- `404` se o usuário não existir

## Regras de Validação

### Username

- mínimo de 3 caracteres
- máximo de 20 caracteres
- apenas letras minúsculas, números, `_` e `.`

### E-mail

- deve ser um e-mail válido

### Nome

- opcional
- mínimo de 3 caracteres
- máximo de 100 caracteres
- não pode conter números nem caracteres especiais

### Senha

- mínimo de 8 caracteres
- máximo de 72 caracteres
- ao menos uma letra minúscula
- ao menos uma letra maiúscula
- ao menos um número
- ao menos um caractere especial entre `@$!%*?&-`

### Código 2FA

- exatamente 6 dígitos numéricos

## Respostas de Erro

### Erro de validação

```json
{
  "error_validator": [
    {
      "field": "email",
      "message": "Este e-mail não é válido"
    }
  ]
}
```

### Erro simples

```json
{
  "message": "Login inválido"
}
```

### Erro de autenticação

```json
{
  "message": "No token"
}
```

```json
{
  "message": "Invalid or expired token"
}
```

### Rate limit

```json
{
  "message": "Muitas tentativas de login, tente novamente mais tarde"
}
```

## Orientação para o Frontend

O frontend pode ser simples e ainda assim ficar correto se seguir este fluxo:

1. Tela de cadastro com validação de username, e-mail, nome e senha.
2. Tela de login com e-mail e senha.
3. Se `POST /api/auth/login` retornar sucesso, abrir tela de verificação 2FA.
4. Na tela de 2FA, pedir e-mail e código de 6 dígitos.
5. Se `POST /api/auth/verify-2fa` retornar sucesso, salvar o JWT.
6. Enviar o token em todas as rotas protegidas no header `Authorization`.
7. Tratar `400`, `401`, `403`, `404`, `429` e `500` com mensagens amigáveis.

### Sugestão de tratamento no frontend

- `400`: erro de formulário ou validação
- `401`: credenciais incorretas ou etapa de login inválida
- `403`: token inválido, expirado ou usuário tentando alterar outro cadastro
- `404`: recurso não encontrado
- `429`: aguardar e tentar novamente depois
- `500`: erro inesperado, exibir mensagem genérica

## Notas Importantes

- O token JWT dura `1d`.
- O código 2FA expira em 10 minutos.
- O login e a confirmação do 2FA têm rate limit.
- A checagem de senha vazada usa a API pública do Have I Been Pwned.
- A API atual retorna algumas rotas com a linha completa do usuário do banco; para interface real, filtre o que for exibido.
- Códigos 2FA gerados e não utilizados continuam em `otp_tokens` até a validação ou a expiração.

## Exemplo de Consumo no Frontend

### Login

1. Enviar e-mail e senha para `POST /api/auth/login`.
2. Exibir mensagem de sucesso e mudar para a tela de 2FA.

### Verificação 2FA

1. Enviar e-mail e código para `POST /api/auth/verify-2fa`.
2. Salvar `token` no estado global, storage ou cookie, conforme a estratégia do frontend.
3. Usar `Authorization: Bearer <token>` nas próximas requisições.

### Atualização de perfil

1. Ler o `id` do usuário logado a partir do token ou da resposta do login.
2. Enviar `PATCH /api/users/id/:id`.
3. Se a API responder `403`, mostrar que o usuário não pode alterar outro cadastro.

## Exemplo de Fluxo Completo

```text
1. POST /api/users
2. POST /api/auth/login
3. POST /api/auth/verify-2fa
4. GET /api/users/id/:id
5. PATCH /api/users/id/:id
6. DELETE /api/users/id/:id
```

## Observação Final

Este projeto foi pensado para fins acadêmicos. A documentação acima segue o comportamento atual da API para facilitar a integração do frontend e a demonstração do fluxo de autenticação em dois fatores.
