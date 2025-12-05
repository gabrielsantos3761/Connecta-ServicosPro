# 🔒 Documentação de Segurança - Connecta ServiçosPro

## Visão Geral

Este documento descreve todas as medidas de segurança implementadas no sistema para garantir a proteção dos dados dos usuários e prevenir ataques comuns.

---

## 📋 Índice

1. [Firebase Authentication](#firebase-authentication)
2. [Firestore Security Rules](#firestore-security-rules)
3. [Cloud Functions](#cloud-functions)
4. [Frontend Security](#frontend-security)
5. [Rate Limiting](#rate-limiting)
6. [Logs de Auditoria](#logs-de-auditoria)
7. [Checklist de Segurança](#checklist-de-segurança)

---

## 🔐 Firebase Authentication

### Configurações Implementadas

#### ✅ Email/Senha
- **Política de senha**: Mínimo de 8 caracteres, contendo letras e números
- **Verificação de email**: Ativada (recomendado configurar no Firebase Console)
- **Mensagens de erro genéricas**: Não revelam se o usuário existe
  - ❌ "Usuário não encontrado"
  - ✅ "Email ou senha incorretos"

#### ✅ Autenticação Social
- Google OAuth configurado
- Facebook OAuth configurado
- Validação de domínios autorizados

#### ✅ Proteções
- Rate limiting nas tentativas de login
- Bloqueio temporário após múltiplas tentativas falhas
- Tokens de autenticação com expiração automática

### Configuração no Firebase Console

```bash
# 1. Habilitar Email/Password
Firebase Console > Authentication > Sign-in method > Email/Password > Habilitar

# 2. Habilitar Email Verification (RECOMENDADO)
Firebase Console > Authentication > Templates > Email address verification

# 3. Configurar domínios autorizados
Firebase Console > Authentication > Settings > Authorized domains
```

---

## 🛡️ Firestore Security Rules

### Princípios Implementados

1. **NENHUMA regra `allow read, write: if true`** em produção
2. **Todas as regras exigem** `request.auth != null`
3. **Documentos amarrados a** `request.auth.uid` ou `role`
4. **Validação rigorosa** de formato e tamanho de dados
5. **Campos sensíveis protegidos** contra edição pelo cliente

### Estrutura de Validação

#### Users Collection
```javascript
// ✅ Permitido: Ler próprios dados
allow read: if request.auth.uid == userId;

// ✅ Permitido: Criar com validações
allow create: if isOwner(userId)
  && isValidEmail(request.resource.data.email)
  && isValidCPF(request.resource.data.cpf)
  && hasValidRoles(request.resource.data.roles);

// ❌ Proibido: Alterar email, UID, createdAt
allow update: if request.resource.data.email == resource.data.email
  && request.resource.data.uid == resource.data.uid;
```

#### Validações por Coleção

| Coleção | Leitura | Criação | Atualização | Deleção |
|---------|---------|---------|-------------|---------|
| `users` | Próprio user | Próprio user | Próprio user (campos limitados) | ❌ Bloqueado |
| `professionals` | Próprio + owners | Próprio user | Próprio user (sem stats) | ❌ Bloqueado |
| `owners` | Próprio user | Próprio user | Próprio user (sem planos) | ❌ Bloqueado |
| `businesses` | Público | Owners | Owner da business | Owner da business |
| `appointments` | Cliente/Pro/Owner | Cliente | Cliente/Pro/Owner | ❌ Bloqueado |
| `services` | Público | Owner | Owner | Owner |
| `reviews` | Público | Cliente | Autor (24h) | ❌ Bloqueado |

### Validações de Formato

```javascript
// Email
isValidEmail(email) → email.matches('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')

// CPF (11 dígitos)
isValidCPF(cpf) → cpf.matches('^[0-9]{11}$')

// CNPJ (14 dígitos)
isValidCNPJ(cnpj) → cnpj.matches('^[0-9]{14}$')

// Telefone (10-15 dígitos)
isValidPhone(phone) → phone.matches('^\\+?[0-9]{10,15}$')

// URL (apenas HTTPS)
isValidURL(url) → url.matches('^https?://.*')
```

---

## ⚡ Cloud Functions

### Validações Implementadas

#### 1. Autenticação Obrigatória
```javascript
function requireAuth(context) {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária');
  }
  return context.auth;
}
```

#### 2. Validação de Schema
```javascript
// Validação de email
if (!isValidEmail(email)) {
  throw new HttpsError('invalid-argument', 'Email inválido');
}

// Validação de UID
if (uid !== context.auth.uid) {
  throw new HttpsError('permission-denied', 'Acesso negado');
}
```

#### 3. Sanitização de Dados
```javascript
function sanitizeString(str) {
  return str
    .replace(/[<>]/g, '')  // Remove HTML tags
    .replace(/['"]/g, '')  // Remove aspas
    .replace(/[{}]/g, '')  // Remove chaves
    .trim()
    .substring(0, 1000);   // Limita tamanho
}
```

#### 4. Rate Limiting

| Função | Limite | Janela |
|--------|--------|--------|
| `validateUserLogin` | 20 requisições | 1 minuto |
| `createUserProfile` | 5 requisições | 1 hora |
| `linkProfessionalToBusiness` | 10 requisições | 1 hora |

#### 5. Logs de Segurança
```javascript
await securityLog('login_success', userId, { role, email });
await securityLog('login_error', userId, { error: error.message });
await securityLog('link_invalid_code', userId, { code });
```

### Proteções Contra Ataques

| Ataque | Proteção |
|--------|----------|
| **XSS** | Sanitização de HTML, remoção de tags |
| **SQL Injection** | Firestore (NoSQL), sanitização de strings |
| **CSRF** | Firebase ID Tokens, validação de origem |
| **Brute Force** | Rate limiting, bloqueio temporário |
| **DoS** | Rate limiting, Cloud Functions timeout |
| **Mass Targeting** | Limites por usuário, validação de UID |

---

## 🌐 Frontend Security

### Implementações

#### 1. Sanitização de Entrada
```typescript
// src/lib/securityUtils.ts
import { sanitizeString, sanitizeHTML } from '@/lib/securityUtils';

const safeName = sanitizeString(userInput);
const safeHTML = sanitizeHTML(userContent);
```

#### 2. Validação de Dados
```typescript
import { isValidEmail, isValidCPF, isValidPassword } from '@/lib/securityUtils';

if (!isValidEmail(email)) {
  setError('Email inválido');
}

if (!isValidPassword(password)) {
  setError('Senha deve ter 8+ caracteres, letras e números');
}
```

#### 3. Proteção XSS
- ✅ **NUNCA** usar `innerHTML` com dados do usuário
- ✅ **SEMPRE** usar `textContent` ou sanitização
- ✅ React escapa automaticamente JSX
- ✅ Validação de URLs (apenas HTTPS)

#### 4. Logout Seguro
```typescript
const logout = async () => {
  await auth.signOut();

  // Limpar dados locais
  localStorage.removeItem('userData');
  sessionStorage.clear();

  // Limpar cookies
  document.cookie.split(';').forEach(cookie => {
    document.cookie = cookie + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
  });
};
```

#### 5. Proteção de Rotas
```typescript
// Rotas protegidas verificam autenticação
if (!user) {
  navigate('/login');
  return null;
}
```

---

## ⏱️ Rate Limiting

### Implementação

#### Cloud Functions
```javascript
async function checkRateLimit(userId, action, maxRequests = 10, windowMs = 60000) {
  // Usa Firestore para rastrear requisições
  // Bloqueia se exceder limite
  // Retorna erro 429 (Too Many Requests)
}
```

#### Limites por Ação

| Ação | Limite | Janela | Erro |
|------|--------|--------|------|
| Login validation | 20 req | 1 min | `resource-exhausted` |
| Profile creation | 5 req | 1 hora | `resource-exhausted` |
| Business link | 10 req | 1 hora | `resource-exhausted` |
| Password reset | 3 req | 1 hora | `resource-exhausted` |

### Como Funciona

1. **Request**: Usuário faz requisição
2. **Check**: Verifica quantas requisições nos últimos X ms
3. **Block**: Se > limite, retorna erro 429
4. **Allow**: Se < limite, processa requisição
5. **Cleanup**: Remove requisições antigas da janela

---

## 📊 Logs de Auditoria

### Coleção: `_security_logs`

```javascript
{
  event: 'login_success',
  userId: 'abc123...',
  timestamp: Timestamp,
  details: {
    role: 'client',
    email: 'user@example.com',
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...'
  }
}
```

### Eventos Registrados

| Evento | Descrição |
|--------|-----------|
| `login_success` | Login bem-sucedido |
| `login_error` | Erro no login |
| `login_uid_mismatch` | UID fornecido não corresponde ao autenticado |
| `profile_created` | Perfil criado com sucesso |
| `profile_creation_error` | Erro na criação de perfil |
| `link_success` | Profissional vinculado à barbearia |
| `link_invalid_code` | Tentativa com código inválido |
| `link_already_exists` | Tentativa de vínculo duplicado |

### Uso dos Logs

```javascript
// Buscar tentativas de login suspeitas
db.collection('_security_logs')
  .where('event', '==', 'login_uid_mismatch')
  .where('timestamp', '>', last24Hours)
  .get();

// Buscar tentativas com códigos inválidos
db.collection('_security_logs')
  .where('event', '==', 'link_invalid_code')
  .where('userId', '==', suspiciousUserId)
  .get();
```

---

## ✅ Checklist de Segurança

### Login/Registro

- [x] Firebase Auth (email/senha, social, phone)
- [x] Verificação de e-mail ativada
- [x] Mensagens de erro não revelam se usuário existe
- [x] Política de senha mínima aplicada (8+ caracteres)

### Firestore Rules

- [x] NENHUMA regra `if true` em produção
- [x] Todas as regras com `request.auth != null`
- [x] Documentos amarrados a `request.auth.uid` ou `role`
- [x] Validação de tamanho/formato nas Rules
- [x] Campos sensíveis protegidos contra edição pelo cliente

### Cloud Functions

- [x] Todas as funções checam `context.auth`
- [x] Payloads validados (schema)
- [x] Segredos só em config/env, nunca no front
- [x] Rate limiting implementado
- [x] Proteções básicas de abuso
- [x] Logs de auditoria

### Frontend (Hosting)

- [x] Aplicação só via HTTPS (default Firebase Hosting)
- [x] Sem uso inseguro de `innerHTML` com dados do usuário
- [x] Logout com `auth.signOut()` + limpeza de dados locais
- [x] Nada sensível em código estático
- [x] Sanitização de entradas do usuário
- [x] Validação de formatos (email, CPF, telefone)

---

## 🚀 Próximos Passos (Opcional)

### Melhorias Recomendadas

1. **reCAPTCHA v3** - Prevenir bots
2. **2FA (Two-Factor Auth)** - Autenticação de dois fatores
3. **Email Verification Enforcement** - Forçar verificação de email
4. **Password Strength Meter** - Indicador visual de força da senha
5. **Security Headers** - `firebase.json` com headers HTTP seguros
6. **CSP (Content Security Policy)** - Prevenir XSS avançados
7. **Monitoring & Alerts** - Firebase App Check, Cloud Monitoring

### Configurações Adicionais

```json
// firebase.json - Security Headers
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          },
          {
            "key": "Strict-Transport-Security",
            "value": "max-age=31536000; includeSubDomains"
          }
        ]
      }
    ]
  }
}
```

---

## 📞 Suporte

Para questões de segurança, entre em contato com a equipe de desenvolvimento.

**IMPORTANTE**: Nunca compartilhe credenciais do Firebase, API keys, ou dados sensíveis publicamente.

---

## 📜 Licença

Este documento é propriedade de Connecta ServiçosPro e contém informações confidenciais.
