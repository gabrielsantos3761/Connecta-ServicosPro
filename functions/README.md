# Firebase Cloud Functions - Connecta ServiçosPro

Este diretório contém as Cloud Functions do projeto Connecta ServiçosPro, utilizando Firebase Functions v2.

## 📋 Funções Disponíveis

### 1. `validateUserLogin`
**Tipo:** Callable Function
**Descrição:** Valida o login do usuário e verifica se o perfil está completo

**Parâmetros:**
```javascript
{
  uid: string,      // UID do usuário no Firebase Auth
  email: string,    // Email do usuário
  role: string      // Role desejado: 'client', 'professional', 'owner'
}
```

**Retorno:**
```javascript
{
  success: boolean,
  userExists: boolean,
  hasProfile: boolean,
  profileComplete: boolean,
  message: string,
  user?: {
    uid: string,
    email: string,
    name: string,
    avatar: string | null,
    phone: string | null,
    activeRole: string,
    roles: string[],
    createdAt: Timestamp
  },
  profile?: object,
  redirectTo?: string
}
```

### 2. `createUserProfile`
**Tipo:** Callable Function
**Descrição:** Cria ou atualiza o perfil de um usuário

**Parâmetros:**
```javascript
{
  uid: string,
  email: string,
  role: string,
  profileData: {
    name: string,
    phone: string,
    avatar?: string,
    // Campos específicos por role:
    // professional: specialty
    // owner: cpfCnpj
  }
}
```

**Retorno:**
```javascript
{
  success: boolean,
  message: string,
  uid: string,
  role: string
}
```

### 3. `linkProfessionalToBusiness`
**Tipo:** Callable Function
**Descrição:** Vincula um profissional a uma barbearia usando código

**Parâmetros:**
```javascript
{
  professionalUid: string,
  businessCode: string
}
```

**Retorno:**
```javascript
{
  success: boolean,
  message: string,
  businessId: string,
  businessName: string
}
```

### 4. `onUserCreated`
**Tipo:** Firestore Trigger
**Descrição:** Executado automaticamente quando um novo usuário é criado
**Trigger:** `onCreate('users/{userId}')`

## 🚀 Deploy

### Instalar dependências
```bash
cd functions
npm install
```

### Deploy para produção
```bash
# Deploy de todas as functions
npm run deploy

# Deploy de uma function específica
firebase deploy --only functions:validateUserLogin
```

### Testar localmente
```bash
# Iniciar emuladores
firebase emulators:start

# Ou apenas functions
npm run serve
```

## 📁 Estrutura de Dados no Firestore

### Coleção: `users`
```
users/{userId}
  - email: string
  - roles: string[]
  - createdAt: Timestamp
  - updatedAt: Timestamp

  profiles/{role}
    - name: string
    - phone: string
    - avatar: string
    - role: string
    - status: string
    - createdAt: Timestamp
    - updatedAt: Timestamp
    - [campos específicos do role]
```

### Coleção: `businesses`
```
businesses/{businessId}
  - name: string
  - linkCode: string (código para vincular profissionais)
  - professionals: string[] (UIDs dos profissionais)
  - status: string
  - ...
```

### Coleção: `business_professional_links`
```
business_professional_links/{linkId}
  - businessId: string
  - professionalUid: string
  - businessName: string
  - status: string
  - linkedAt: Timestamp
```

## 🔧 Configuração

### Região
Todas as functions estão configuradas para rodar em `southamerica-east1` (São Paulo)

### Variáveis de Ambiente
Adicione variáveis de ambiente usando:
```bash
firebase functions:config:set someservice.key="THE API KEY"
```

## 📝 Logs

### Ver logs em tempo real
```bash
npm run logs
```

### Ver logs de uma função específica
```bash
firebase functions:log --only validateUserLogin
```

## 🔐 Segurança

- Todas as callable functions validam os parâmetros de entrada
- Erros são tratados e retornam mensagens apropriadas
- Dados sensíveis não são expostos nos logs
- Validação de roles e permissões implementada

## 🧪 Testes

Para adicionar testes unitários:
```bash
npm install --save-dev firebase-functions-test
```

## 📚 Documentação Adicional

- [Firebase Functions v2](https://firebase.google.com/docs/functions)
- [Callable Functions](https://firebase.google.com/docs/functions/callable)
- [Firestore Triggers](https://firebase.google.com/docs/functions/firestore-events)
