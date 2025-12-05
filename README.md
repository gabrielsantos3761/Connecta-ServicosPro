# 💈 Connecta ServiçosPro - Sistema de Gestão para Barbearias

Sistema moderno, elegante e **altamente seguro** para gestão de barbearias, salões de beleza e estética.

## ✨ Recursos Principais

- 🎯 **Dashboard Interativo**: Visão geral completa com métricas e estatísticas em tempo real
- 📅 **Gestão de Agendamentos**: Sistema completo de agendamentos com filtros avançados
- 💼 **Catálogo de Serviços**: Gerencie todos os serviços oferecidos
- 👥 **Gestão de Profissionais**: Controle sua equipe e especialidades
- 🎨 **Design Premium**: Interface elegante com animações suaves e responsiva
- 🔐 **Segurança Avançada**: Sistema com múltiplas camadas de proteção

## 🔒 Segurança

Este sistema implementa as **melhores práticas de segurança** da indústria:

- ✅ Firebase Authentication com múltiplos provedores
- ✅ Firestore Security Rules robustas (0% de regras `if true`)
- ✅ Cloud Functions com validação completa de payloads
- ✅ Rate limiting para prevenir abuso
- ✅ Sanitização de dados no frontend e backend
- ✅ Logs de auditoria para rastreamento de eventos
- ✅ Headers HTTP de segurança configurados
- ✅ Proteção contra XSS, SQL Injection, CSRF, e outros ataques

📖 **[Documentação Completa de Segurança](./SECURITY.md)**

## 🚀 Tecnologias

### Frontend
- **React** + **TypeScript** - Base moderna e tipada
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes de interface elegantes
- **Framer Motion** - Animações suaves
- **Lucide React** - Ícones modernos
- **React Router** - Navegação entre páginas
- **Vite** - Build tool extremamente rápido

### Backend (Firebase)
- **Firebase Authentication** - Sistema de autenticação robusto
- **Cloud Firestore** - Banco de dados NoSQL em tempo real
- **Cloud Functions** - Funções serverless (Node.js)
- **Firebase Storage** - Armazenamento de arquivos
- **Firebase Hosting** - Hospedagem com CDN global

## 🛠️ Como Executar Localmente

### Pré-requisitos

- Node.js 18+ instalado
- Conta no Firebase (gratuita)
- npm ou yarn

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/connecta-servicospro.git
cd connecta-servicospro
```

### 2. Instalar Dependências

```bash
# Frontend
npm install

# Cloud Functions
cd functions
npm install
cd ..
```

### 3. Configurar Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Copie as credenciais do Firebase
3. Crie um arquivo `.env` na raiz do projeto:

```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
VITE_FIREBASE_MEASUREMENT_ID=seu_measurement_id
```

⚠️ **IMPORTANTE**: Adicione `.env` ao `.gitignore` para não commitar credenciais!

### 4. Executar em Desenvolvimento

```bash
# Emuladores do Firebase (recomendado para desenvolvimento)
firebase emulators:start

# Em outro terminal, executar o frontend
npm run dev
```

Abra seu navegador em `http://localhost:5173`

## 📦 Build para Produção

```bash
# Build do frontend
npm run build

# Preview da build local
npm run preview
```

## 🚀 Deploy

Para fazer o deploy completo (frontend + backend + rules):

```bash
firebase deploy
```

📖 **[Guia Completo de Deploy](./DEPLOY_SECURITY.md)**

## 📁 Estrutura do Projeto

```
connecta-servicospro/
├── src/
│   ├── components/         # Componentes reutilizáveis
│   │   ├── layout/        # Layout (Sidebar, Header, etc)
│   │   └── ui/            # Componentes UI (shadcn)
│   ├── pages/             # Páginas da aplicação
│   │   ├── Login.tsx      # Página de login
│   │   ├── Register.tsx   # Página de registro
│   │   └── ...
│   ├── contexts/          # Contexts do React
│   │   └── AuthContext.tsx
│   ├── services/          # Serviços (API, Auth, etc)
│   │   ├── authService.ts
│   │   └── functionsService.ts
│   ├── lib/               # Utilitários
│   │   ├── firebase.ts    # Configuração Firebase
│   │   └── securityUtils.ts # Utilitários de segurança
│   ├── types/             # Tipos TypeScript
│   └── App.tsx            # Componente principal
├── functions/             # Cloud Functions (Backend)
│   ├── index.js          # Funções serverless
│   └── package.json
├── firestore.rules       # Regras de segurança do Firestore
├── firebase-storage.rules # Regras de segurança do Storage
├── firebase.json         # Configuração do Firebase
├── SECURITY.md           # 📖 Documentação de Segurança
├── DEPLOY_SECURITY.md    # 🚀 Guia de Deploy
└── SECURITY_SUMMARY.md   # 📋 Resumo de Segurança
```

## 🎭 Tipos de Usuário

O sistema suporta 3 tipos de usuário com permissões diferentes:

| Tipo | Descrição | Funcionalidades |
|------|-----------|-----------------|
| 👤 **Cliente** | Usuários que agendam serviços | Agendar, cancelar, avaliar |
| ✂️ **Profissional** | Barbeiros/cabeleireiros | Gerenciar agenda, atender clientes |
| 👑 **Proprietário** | Donos de estabelecimentos | Gestão completa do negócio |

## 📄 Documentação

- 📖 [**Documentação de Segurança Completa**](./SECURITY.md) - Todas as medidas de segurança implementadas
- 🚀 [**Guia de Deploy Seguro**](./DEPLOY_SECURITY.md) - Passo a passo para deploy em produção
- 📋 [**Resumo de Segurança**](./SECURITY_SUMMARY.md) - Quick reference de segurança

## 🧪 Testes

```bash
# Executar emuladores do Firebase
firebase emulators:start

# Testar Security Rules localmente
# Os emuladores permitem testar as rules antes do deploy
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

⚠️ **Lembre-se**: Nunca commite credenciais do Firebase (`.env`), sempre adicione ao `.gitignore`!

## 📞 Suporte

Para questões técnicas ou de segurança:
- 📧 Email: suporte@connectaservicospro.com
- 🐛 Issues: [GitHub Issues](https://github.com/seu-usuario/connecta-servicospro/issues)

## 📜 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**Desenvolvido com ❤️ e 🔒 (segurança em primeiro lugar)**
