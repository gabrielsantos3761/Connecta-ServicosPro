# 🚀 Guia de Deploy com Segurança

## Pré-requisitos

Antes de fazer o deploy, certifique-se de que todas as configurações de segurança estão corretas.

---

## 📋 Checklist Pré-Deploy

### 1. Firebase Console - Authentication

```bash
1. Acesse: Firebase Console > Authentication > Sign-in method

2. Configure Email/Password:
   ☑ Habilitar Email/Password
   ☑ Ativar "Email link (passwordless sign-in)" (opcional)

3. Configure Email Verification:
   ☑ Authentication > Templates > Email address verification
   ☑ Customizar template de email (opcional)

4. Configure domínios autorizados:
   ☑ Authentication > Settings > Authorized domains
   ☑ Adicionar seu domínio de produção
   ☑ Remover domínios de teste/desenvolvimento

5. Configure proteções:
   ☑ Settings > Password policy > Enforcement (Medium ou Strong)
   ☑ Settings > User account management > Prevent creation of accounts with disposable email addresses
```

### 2. Variáveis de Ambiente

Verifique se todas as variáveis estão configuradas:

```bash
# .env (NÃO COMMITAR)
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
VITE_FIREBASE_MEASUREMENT_ID=seu_measurement_id
```

**IMPORTANTE**:
- ❌ NUNCA commitar arquivo `.env` no Git
- ✅ Adicionar `.env` ao `.gitignore`
- ✅ Criar `.env.example` com valores placeholder

### 3. Firebase Security Rules

```bash
# Testar Rules localmente
firebase emulators:start

# Validar sintaxe das Rules
firebase deploy --only firestore:rules --dry-run

# Deploy das Rules
firebase deploy --only firestore:rules
```

### 4. Cloud Functions

```bash
# Instalar dependências
cd functions
npm install

# Testar localmente
firebase emulators:start --only functions

# Deploy
firebase deploy --only functions
```

---

## 🔧 Configurações de Segurança

### 1. Firebase Console - Firestore

```bash
1. Firestore Database > Rules
   ☑ Verificar que NÃO há "allow read, write: if true"
   ☑ Todas as regras exigem autenticação
   ☑ Campos sensíveis protegidos

2. Firestore Database > Indexes
   ☑ Criar índices necessários para queries
   ☑ Verificar performance

3. Firestore Database > Usage
   ☑ Configurar alertas de uso
   ☑ Definir limites de budget
```

### 2. Firebase Console - Storage

```bash
1. Storage > Rules
   ☑ Configurar regras de upload
   ☑ Limitar tamanhos de arquivo
   ☑ Validar tipos de arquivo (apenas imagens)

2. Storage > Files
   ☑ Configurar CORS se necessário
   ☑ Definir políticas de retenção
```

### 3. Firebase Console - App Check (Recomendado)

```bash
1. App Check > Register
   ☑ Registrar aplicação web
   ☑ Configurar reCAPTCHA v3

2. App Check > APIs
   ☑ Enforçar App Check para Firestore
   ☑ Enforçar App Check para Cloud Functions
   ☑ Enforçar App Check para Storage
```

---

## 📦 Deploy Completo

### Passo 1: Build da Aplicação

```bash
# Instalar dependências
npm install

# Build de produção
npm run build

# Verificar build
ls -la dist/
```

### Passo 2: Deploy Firebase

```bash
# Login no Firebase
firebase login

# Selecionar projeto
firebase use seu-projeto-id

# Deploy completo (Hosting + Functions + Rules)
firebase deploy

# OU deploy individual:
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### Passo 3: Verificação Pós-Deploy

```bash
1. Testar autenticação:
   ☑ Registro de novo usuário
   ☑ Login com email/senha
   ☑ Login com Google
   ☑ Login com Facebook
   ☑ Logout e limpeza de dados locais

2. Testar Firestore Rules:
   ☑ Tentar acessar dados de outros usuários (deve falhar)
   ☑ Tentar editar campos protegidos (deve falhar)
   ☑ Validar que queries retornam apenas dados autorizados

3. Testar Cloud Functions:
   ☑ Validação de login
   ☑ Criação de perfil
   ☑ Vinculação de profissional
   ☑ Rate limiting

4. Testar segurança:
   ☑ Tentar XSS em campos de texto
   ☑ Tentar SQL injection (deve ser bloqueado)
   ☑ Verificar headers de segurança (usar developer tools)
```

---

## 🔍 Monitoramento

### 1. Firebase Console - Analytics

```bash
1. Analytics > Events
   ☑ Monitorar eventos de autenticação
   ☑ Rastrear erros

2. Analytics > DebugView
   ☑ Verificar eventos em tempo real
```

### 2. Firebase Console - Monitoring

```bash
1. Functions > Dashboard
   ☑ Monitorar invocações
   ☑ Verificar erros
   ☑ Analisar latência

2. Firestore > Usage
   ☑ Verificar reads/writes
   ☑ Configurar alertas de quota
```

### 3. Logs de Segurança

```bash
# Firestore Console > Data > _security_logs
☑ Revisar logs diariamente
☑ Investigar eventos suspeitos:
  - login_uid_mismatch
  - link_invalid_code
  - múltiplas tentativas de login falhadas
```

---

## 🚨 Em Caso de Incidente de Segurança

### 1. Resposta Imediata

```bash
1. Desabilitar usuário comprometido:
   Firebase Console > Authentication > Users > [usuário] > Disable account

2. Invalidar todas as sessões:
   Firebase Console > Authentication > Users > [usuário] > Sign out user

3. Revisar logs de auditoria:
   Firestore > _security_logs
   Functions > Logs

4. Bloquear IPs suspeitos (se aplicável):
   Cloud Functions > Configurar rate limiting mais agressivo
```

### 2. Investigação

```bash
1. Identificar escopo:
   ☑ Quais dados foram acessados?
   ☑ Quais ações foram realizadas?
   ☑ Outros usuários foram afetados?

2. Revisar logs:
   ☑ _security_logs collection
   ☑ Cloud Functions logs
   ☑ Authentication logs

3. Análise forense:
   ☑ Exportar logs relevantes
   ☑ Documentar timeline do incidente
```

### 3. Remediação

```bash
1. Corrigir vulnerabilidade:
   ☑ Atualizar Security Rules
   ☑ Atualizar Cloud Functions
   ☑ Deploy de correção

2. Notificar usuários afetados (se necessário)

3. Implementar controles adicionais:
   ☑ 2FA obrigatório
   ☑ App Check enforced
   ☑ Rate limiting mais restritivo
```

---

## 📝 Backup e Disaster Recovery

### 1. Backup Automático

```bash
# Configurar backup automático do Firestore
gcloud firestore export gs://[BUCKET_NAME]

# Agendar backups diários (usar Cloud Scheduler)
# Firebase Console > Firestore > Import/Export
```

### 2. Plano de Recuperação

```bash
1. Backup de Rules:
   ☑ Versionar firestore.rules no Git
   ☑ Manter histórico de mudanças

2. Backup de Functions:
   ☑ Versionar código no Git
   ☑ Manter tags de versões estáveis

3. Backup de dados:
   ☑ Exports periódicos do Firestore
   ☑ Testar restore regularmente
```

---

## ✅ Checklist Final

### Antes do Deploy em Produção

- [ ] Todas as variáveis de ambiente configuradas
- [ ] `.env` adicionado ao `.gitignore`
- [ ] Firebase Security Rules testadas localmente
- [ ] Cloud Functions testadas localmente
- [ ] Rate limiting configurado
- [ ] Logs de auditoria implementados
- [ ] Headers de segurança configurados no `firebase.json`
- [ ] Email verification habilitada no Firebase Console
- [ ] Política de senha forte configurada
- [ ] Domínios autorizados configurados
- [ ] App Check configurado (recomendado)
- [ ] Monitoring e alertas configurados
- [ ] Plano de backup implementado
- [ ] Documentação de segurança revisada
- [ ] Testes de penetração realizados (recomendado)

### Após o Deploy

- [ ] Testar autenticação completa
- [ ] Verificar Security Rules
- [ ] Testar Cloud Functions
- [ ] Verificar headers de segurança
- [ ] Monitorar logs por 24h
- [ ] Configurar alertas de erro
- [ ] Revisar custos e quotas

---

## 📞 Suporte

Em caso de dúvidas ou problemas de segurança, consulte:

- 📖 [Documentação de Segurança](./SECURITY.md)
- 🔗 [Firebase Security Documentation](https://firebase.google.com/docs/rules)
- 🔗 [Firebase Best Practices](https://firebase.google.com/docs/rules/security-best-practices)

---

**Última atualização**: 2025-12-04
