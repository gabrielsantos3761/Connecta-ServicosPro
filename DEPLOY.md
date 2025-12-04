# 🚀 Guia de Deploy - Connecta ServiçosPro

## ✅ Pré-requisitos

O projeto já está pronto para deploy! Todos os arquivos foram criados e o build foi concluído com sucesso.

## 📋 Passos para Deploy

### 1. Fazer Login no Firebase

```bash
firebase login
```

Isso abrirá o navegador para você fazer login com sua conta Google que tem acesso ao projeto Firebase.

### 2. Verificar Projeto Conectado

```bash
firebase projects:list
```

Verifique se `connecta-servicospro` aparece na lista. Se não aparecer, você precisa:

**Opção A**: Mudar o projeto no arquivo `.firebaserc`:
```bash
firebase use --add
```
Selecione o projeto correto da lista.

**Opção B**: Se o projeto não existe, crie um novo:
```bash
firebase projects:create
```

### 3. Deploy das Cloud Functions

```bash
# Deploy apenas das functions
firebase deploy --only functions

# Ou deploy de tudo (functions + hosting + storage rules)
firebase deploy
```

### 4. Deploy do Hosting

```bash
# Deploy apenas do hosting
firebase deploy --only hosting
```

### 5. Deploy Completo (Recomendado)

```bash
# Deploy de tudo de uma vez
firebase deploy
```

## 🌐 Após o Deploy

Após o deploy bem-sucedido, você receberá:

- **URL do Hosting**: `https://connecta-servicospro.web.app` (ou `.firebaseapp.com`)
- **URL das Functions**: `https://southamerica-east1-connecta-servicospro.cloudfunctions.net`

## 📁 O que foi Criado

### Backend (Cloud Functions)

✅ **functions/index.js** - 4 Cloud Functions:
- `validateUserLogin` - Validação de login com perfil
- `createUserProfile` - Criação de perfis de usuário
- `linkProfessionalToBusiness` - Vinculação de profissional a estabelecimento
- `onUserCreated` - Trigger automático quando usuário é criado

### Configuração

✅ **firebase.json** - Configuração do projeto
✅ **.firebaserc** - Alias do projeto
✅ **functions/package.json** - Dependências das functions
✅ **dist/** - Build do frontend

### Integração

✅ **src/services/functionsService.ts** - Cliente para chamar as Cloud Functions
✅ **src/services/authService.ts** - Integrado com validateUserLogin
✅ **src/pages/ProfissionalAssociarBarbearia.tsx** - Integrado com linkProfessionalToBusiness

## 🔧 Comandos Úteis

```bash
# Ver logs das functions
firebase functions:log

# Ver logs de uma function específica
firebase functions:log --only validateUserLogin

# Testar localmente (emuladores)
firebase emulators:start

# Ver status do deploy
firebase hosting:channel:list

# Deploy para canal de preview (teste)
firebase hosting:channel:deploy preview
```

## 🐛 Resolução de Problemas

### Erro: "Project not found"
```bash
firebase use --add
```
Selecione o projeto correto.

### Erro: "Permission denied"
```bash
firebase login --reauth
```

### Erro: "Functions deployment failed"
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### Erro: "Hosting deployment failed"
```bash
npm run build
firebase deploy --only hosting
```

## 📝 Notas Importantes

1. **Região das Functions**: Configuradas para `southamerica-east1` (São Paulo)
2. **Node Version**: Functions requerem Node.js 18
3. **Firestore Rules**: Não esqueça de configurar as regras de segurança no console Firebase
4. **Environment Variables**: Certifique-se de que o arquivo `.env` está configurado corretamente

## 🔐 Segurança

Antes de ir para produção:

1. Configure as Firestore Security Rules
2. Configure as Storage Security Rules (já criado em `firebase-storage.rules`)
3. Adicione domínios autorizados no Firebase Console
4. Configure CORS se necessário

## 💰 Custos

Firebase oferece plano gratuito (Spark Plan) com:
- 125K invocações de functions/mês
- 10GB de hosting
- 1GB de Firestore
- 5GB de Storage

Para produção, considere o plano Blaze (pay-as-you-go).

## 🎉 Pronto!

Seu projeto está configurado e pronto para deploy!

Execute: `firebase deploy`
