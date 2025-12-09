# 🔐 Sistema de Autenticação e Gestão de Sessões

## 📋 Visão Geral

Este documento descreve o sistema completo de autenticação implementado no projeto, incluindo:
- Autenticação multi-método (Email/Senha, Google, Facebook)
- Gestão de sessões com refresh tokens
- Renovação automática de tokens (sliding expiration)
- Controle de dispositivos conectados
- Logout seletivo e de todos os dispositivos

---

## 🎯 Objetivos Alcançados

✅ **Token ativo o tempo todo** - Sistema com sliding expiration que renova automaticamente
✅ **Só cai se deslogar** - Sessão permanece ativa até revogação manual ou expiração
✅ **Controle de dispositivos** - Limite de 5 dispositivos, gerenciamento individual
✅ **Segurança robusta** - Rate limiting, validações, logs de auditoria
✅ **Multi-role** - Suporte para client, professional, owner

---

## 🏗️ Arquitetura

### Frontend (React + TypeScript)
```
src/
├── types/
│   └── session.ts              # Types do sistema de sessões
├── services/
│   ├── authService.ts          # Autenticação Firebase (original)
│   ├── sessionService.ts       # Gestão de sessões
│   └── authSessionIntegration.ts # Integração dos dois sistemas
└── contexts/
    └── AuthContext.tsx         # Context com renovação automática
```

### Backend (Firebase Cloud Functions)
```
functions/
└── index.js
    ├── createSession          # Cria sessão após login
    ├── refreshSession         # Renova access token
    ├── revokeSession          # Logout de um dispositivo
    ├── revokeAllSessions      # Logout de todos os dispositivos
    ├── listActiveSessions     # Lista dispositivos conectados
    └── validateSession        # Valida se sessão está ativa
```

### Banco de Dados (Firestore)
```
users/{userId}                  # Dados do usuário
  ├── uid
  ├── email
  ├── displayName
  ├── roles: [...]
  ├── activeRole
  └── ...

sessions/{sessionId}            # Sessões ativas
  ├── userId
  ├── deviceId
  ├── userAgent
  ├── ipAddress (opcional)
  ├── refreshTokenHash         # Hash SHA-256 do token
  ├── activeRole
  ├── deviceMetadata
  ├── createdAt
  ├── expiresAt               # Sliding: +90 dias a cada uso
  ├── lastUsedAt
  ├── revokedAt               # null se ativa
  └── isActive
```

---

## 🔄 Fluxo Completo de Autenticação

### 1. Login (Email, Google ou Facebook)

```typescript
// Frontend
import { loginWithEmail } from '@/services/authSessionIntegration';

await loginWithEmail('user@email.com', 'senha123', 'client');
```

**O que acontece:**

1. **Autenticação Firebase** (`authService.ts`)
   - Valida credenciais no Firebase Auth
   - Busca/cria perfil no Firestore
   - Retorna `UserProfile`

2. **Criação de Sessão** (`sessionService.ts` → Cloud Function)
   - Gera Device ID único (se não existir)
   - Chama `createSession` Cloud Function
   - Backend:
     - Verifica limite de sessões (máx 5)
     - Se exceder, revoga a mais antiga
     - Gera refresh token seguro (64 bytes random)
     - Armazena hash SHA-256 do token
     - Cria custom token do Firebase
   - Frontend:
     - Guarda `sessionId`, `refreshToken`, `expiresAt` no localStorage
     - Faz login com custom token

3. **Monitoramento Automático** (`AuthContext.tsx`)
   - Inicia verificação a cada 1 minuto
   - Se token expira em <5min → renova automaticamente

---

### 2. Renovação Automática de Token

```typescript
// Automático! Mas pode ser chamado manualmente:
import { refreshSession } from '@/services/sessionService';

await refreshSession();
```

**O que acontece:**

1. Frontend lê `sessionId` e `refreshToken` do localStorage
2. Chama `refreshSession` Cloud Function
3. Backend:
   - Busca sessão no Firestore
   - Valida que está ativa e não expirou
   - Compara hash do token enviado com o armazenado
   - Gera novo custom token
   - **Sliding Expiration**: atualiza `expiresAt` para +90 dias
   - Atualiza `lastUsedAt`
4. Frontend:
   - Recebe novo access token
   - Faz login com custom token
   - Atualiza `expiresAt` no localStorage

**Resultado:** Enquanto o usuário continuar usando, a sessão nunca expira! 🎉

---

### 3. Logout

#### Logout do Dispositivo Atual
```typescript
import { logout } from '@/services/authSessionIntegration';

await logout();
```

**O que acontece:**
1. Revoga sessão atual no backend (marca `revokedAt`)
2. Limpa localStorage (exceto theme, language, device_id)
3. Logout do Firebase Auth
4. Redireciona para `/login`

#### Logout de Todos os Dispositivos
```typescript
import { revokeAllSessions } from '@/services/sessionService';

// Revoga TODAS as sessões
await revokeAllSessions(false);

// Revoga TODAS, exceto a atual
await revokeAllSessions(true);
```

**Casos de uso:**
- Usuário trocou a senha → revogar todas
- Dispositivo roubado → revogar aquele específico
- Suspeita de invasão → revogar todas

---

## 🔒 Segurança

### Proteções Implementadas

1. **Tokens Nunca em Texto Plano**
   - Refresh tokens são gerados com `crypto.randomBytes(64)`
   - Armazenados como hash SHA-256 no Firestore
   - Comparação com `crypto.timingSafeEqual` (previne timing attacks)

2. **Rate Limiting**
   - `createSession`: 5 criações por hora
   - `refreshSession`: 60 renovações por hora
   - `validateLogin`: 20 validações por minuto

3. **Firestore Rules**
   ```javascript
   match /sessions/{sessionId} {
     // Leitura: apenas o próprio usuário
     allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;

     // Criação/Atualização: apenas via Cloud Function
     allow create, update: if false;

     // Deleção: usuário pode deletar sua própria sessão
     allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
   }
   ```

4. **Validações Rigorosas**
   - Todos os payloads validados antes de processar
   - Sanitização de strings (anti-XSS)
   - Validação de formato (email, CPF, telefone, etc.)

5. **Logs de Auditoria**
   - Coleção `_security_logs` registra todos os eventos
   - Login, logout, renovações, tentativas inválidas
   - Inclui: timestamp, userId, deviceId, IP, etc.

---

## 📊 Configurações

### Duração de Tokens (functions/index.js)

```javascript
const SESSION_CONFIG = {
  accessTokenDuration: 60 * 60 * 1000,           // 1 hora
  refreshTokenDuration: 90 * 24 * 60 * 60 * 1000, // 90 dias
  useSlidingExpiration: true,                    // Renova a cada uso
  autoRefreshThreshold: 5 * 60 * 1000,           // Renova 5min antes
  maxSessionsPerUser: 5,                         // Máx 5 dispositivos
};
```

**Para ajustar:**
- `accessTokenDuration`: Quanto tempo o custom token é válido
- `refreshTokenDuration`: Quanto tempo a sessão pode ficar inativa
- `useSlidingExpiration`: Se `true`, renova `expiresAt` a cada uso
- `maxSessionsPerUser`: Limite de dispositivos simultâneos

---

## 🧪 Como Testar

### 1. Login e Criação de Sessão

```bash
# Abrir console do navegador
# Fazer login normalmente

# Verificar localStorage
localStorage.getItem('barber_session_id')
localStorage.getItem('barber_refresh_token')
localStorage.getItem('barber_device_id')

# Verificar Firestore
# Abrir Firebase Console → Firestore
# Coleção 'sessions' → Ver sessão criada
```

### 2. Renovação Automática

```javascript
// No console do navegador
import { getTokenInfo } from '@/services/sessionService';

// Ver info do token
console.log(getTokenInfo());

// Aguardar 1-2 minutos
// Verificar logs do console para ver renovação automática
```

### 3. Logout Seletivo

```javascript
import { listActiveSessions, revokeSession } from '@/services/sessionService';

// Listar sessões
const sessions = await listActiveSessions();
console.log(sessions);

// Revogar uma sessão específica
await revokeSession({ sessionId: 'xxx' });
```

---

## 🚀 Deploy

### 1. Deploy das Cloud Functions

```bash
cd functions
npm install
npm run deploy
```

### 2. Atualizar Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 3. Deploy do Frontend

```bash
npm run build
# Deploy para seu hosting (Vercel, Netlify, Firebase Hosting, etc.)
```

---

## 📱 Gerenciamento de Sessões (UI)

Você pode criar uma página para o usuário visualizar e gerenciar dispositivos conectados:

```typescript
import { listActiveSessions, revokeSession } from '@/services/sessionService';

function ActiveSessions() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    async function load() {
      const activeSessions = await listActiveSessions();
      setSessions(activeSessions);
    }
    load();
  }, []);

  async function handleRevoke(sessionId: string) {
    await revokeSession({ sessionId });
    // Recarregar lista
  }

  return (
    <div>
      <h2>Dispositivos Conectados</h2>
      {sessions.map(session => (
        <div key={session.id}>
          <p>{session.deviceName}</p>
          <p>Último uso: {new Date(session.lastUsedAt).toLocaleString()}</p>
          {!session.isCurrent && (
            <button onClick={() => handleRevoke(session.id)}>
              Revogar
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### Erro: "Sessão não encontrada"
- Verifique se o localStorage tem `sessionId` e `refreshToken`
- Verifique se a sessão existe no Firestore
- Verifique se não foi revogada (`revokedAt` deve ser `null`)

### Erro: "Token de renovação inválido"
- O refresh token foi alterado/corrompido
- Faça logout e login novamente

### Sessão não renova automaticamente
- Verifique se `AuthContext` está inicializando `startSessionMonitoring`
- Verifique console do navegador para erros
- Verifique se o tempo de expiração está próximo

### Cloud Function retorna erro
- Verifique logs: `firebase functions:log`
- Verifique se o Admin SDK está configurado corretamente
- Verifique rate limiting (pode estar excedendo limites)

---

## 📚 Referências

- [Firebase Auth Custom Tokens](https://firebase.google.com/docs/auth/admin/create-custom-tokens)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [OAuth 2.0 Refresh Tokens](https://oauth.net/2/refresh-tokens/)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

---

## ✅ Checklist de Implementação

- [x] Types do sistema de sessões
- [x] Cloud Functions (createSession, refreshSession, etc.)
- [x] sessionService no frontend
- [x] authSessionIntegration
- [x] Atualização do AuthContext
- [x] Firestore Rules para coleção sessions
- [x] Sistema de renovação automática
- [x] Rate limiting e validações
- [x] Logs de segurança
- [x] Documentação completa

---

## 🎉 Conclusão

Você agora tem um sistema de autenticação **enterprise-grade** com:
- ✅ Login permanente (enquanto o usuário usar)
- ✅ Controle total sobre dispositivos
- ✅ Segurança robusta
- ✅ Auditoria completa
- ✅ Experiência de usuário excelente

**Próximos passos sugeridos:**
1. Criar página de gerenciamento de sessões
2. Adicionar notificações push quando novo login é detectado
3. Implementar 2FA (autenticação de dois fatores)
4. Adicionar geolocalização nas sessões
5. Dashboard de analytics de segurança

---

**Desenvolvido com ❤️ para Projeto Barbearia**
