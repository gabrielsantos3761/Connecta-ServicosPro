# Sistema de Hierarquia de Roles

## 📊 Visão Geral

Este sistema implementa uma hierarquia de roles onde cada nível superior herda automaticamente as permissões dos níveis inferiores.

```
Owner (Proprietário)
    ↓ (herda tudo de Professional)
Professional (Profissional)
    ↓ (herda tudo de Client)
Client (Cliente)
```

## 🎯 Hierarquia

### 1️⃣ Client (Cliente) - Nível Base
- **Acesso**: Apenas funcionalidades de cliente
- **Permissões**:
  - Ver seu próprio perfil
  - Agendar serviços
  - Ver histórico de agendamentos
  - Avaliar profissionais
  - Ver barbearias disponíveis

### 2️⃣ Professional (Profissional) - Nível Intermediário
- **Acesso**: Funcionalidades de profissional + TODAS de cliente
- **Permissões herdadas**: Todas do Client
- **Permissões exclusivas**:
  - Gerenciar agenda profissional
  - Ver agendamentos recebidos
  - Aceitar/recusar agendamentos
  - Ver estatísticas de atendimento
  - Configurar horários disponíveis

### 3️⃣ Owner (Proprietário) - Nível Máximo
- **Acesso**: Funcionalidades de proprietário + TODAS de profissional + TODAS de cliente
- **Permissões herdadas**: Todas do Professional e Client
- **Permissões exclusivas**:
  - Criar e gerenciar barbearias
  - Adicionar/remover profissionais
  - Ver relatórios financeiros
  - Configurar planos e assinaturas
  - Gerenciar serviços oferecidos
  - Painel administrativo completo

## 💻 Como Usar

### 1. No Componente com `ProtectedContent`

```tsx
import { ProtectedContent } from '@/components/ProtectedContent';

function MyComponent() {
  return (
    <div>
      {/* Visível para: Owner, Professional, Client */}
      <ProtectedContent requiredRole="client">
        <button>Meu Perfil</button>
        <button>Agendar Serviço</button>
      </ProtectedContent>

      {/* Visível para: Owner, Professional (NÃO para Client) */}
      <ProtectedContent requiredRole="professional">
        <button>Minha Agenda</button>
        <button>Ver Atendimentos</button>
      </ProtectedContent>

      {/* Visível APENAS para: Owner */}
      <ProtectedContent requiredRole="owner">
        <button>Painel Administrativo</button>
        <button>Relatórios Financeiros</button>
      </ProtectedContent>
    </div>
  );
}
```

### 2. Usando o Hook `useAuth`

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, hasPermission, getAccessibleRoles } = useAuth();

  // Verifica se pode acessar funcionalidades de profissional
  const canManageSchedule = hasPermission('professional');

  // Mostra todas as funcionalidades acessíveis
  const accessibleRoles = getAccessibleRoles();

  return (
    <div>
      <h2>Olá, {user?.name}!</h2>
      <p>Role ativo: {user?.activeRole}</p>
      <p>Você pode acessar: {accessibleRoles.join(', ')}</p>

      {canManageSchedule && (
        <button>Gerenciar Agenda Profissional</button>
      )}
    </div>
  );
}
```

### 3. Protegendo Páginas Inteiras com HOC

```tsx
import { withRoleProtection } from '@/components/ProtectedContent';

// Página acessível APENAS para Owner
function AdminDashboard() {
  return (
    <div>
      <h1>Painel Administrativo</h1>
      {/* Conteúdo exclusivo do owner */}
    </div>
  );
}

export default withRoleProtection(AdminDashboard, 'owner');
```

```tsx
// Página acessível para Professional e Owner
function ScheduleManagement() {
  return (
    <div>
      <h1>Gerenciar Agenda</h1>
      {/* Conteúdo para profissionais */}
    </div>
  );
}

export default withRoleProtection(ScheduleManagement, 'professional');
```

### 4. Usando Funções Auxiliares

```tsx
import {
  hasRolePermission,
  getAccessibleRoles,
  getHighestRole,
  getRolePermissionDescription,
} from '@/utils/roleHierarchy';

// Verifica se owner pode acessar recursos de client
hasRolePermission('owner', 'client'); // true

// Verifica se client pode acessar recursos de professional
hasRolePermission('client', 'professional'); // false

// Mostra roles acessíveis
getAccessibleRoles('owner'); // ['owner', 'professional', 'client']
getAccessibleRoles('professional'); // ['professional', 'client']
getAccessibleRoles('client'); // ['client']

// Encontra o role mais alto
getHighestRole(['client', 'professional']); // 'professional'
getHighestRole(['client', 'owner']); // 'owner'

// Descrição de permissões
getRolePermissionDescription('owner');
// "Acesso total: Proprietário, Profissional e Cliente"
```

## 🔒 Regras de Segurança Firestore

As regras do Firestore também devem respeitar esta hierarquia:

```javascript
// Exemplo de regra hierárquica
match /appointments/{appointmentId} {
  allow read: if isAuthenticated() && (
    // Client pode ver seus próprios agendamentos
    resource.data.clientId == request.auth.uid
    // Professional pode ver agendamentos onde é o profissional
    || resource.data.professionalId == request.auth.uid
    // Owner pode ver todos os agendamentos de sua barbearia
    || get(/databases/$(database)/documents/businesses/$(resource.data.businessId)).data.ownerId == request.auth.uid
  );
}
```

## 🎨 Exemplos Práticos

### Menu de Navegação Dinâmico

```tsx
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedContent } from '@/components/ProtectedContent';

function NavigationMenu() {
  const { user, getPermissionDescription } = useAuth();

  return (
    <nav>
      <p className="text-sm text-gray-500">
        {getPermissionDescription()}
      </p>

      {/* Links visíveis para todos */}
      <ProtectedContent requiredRole="client">
        <a href="/perfil">Meu Perfil</a>
        <a href="/agendar">Agendar Serviço</a>
        <a href="/historico">Meus Agendamentos</a>
      </ProtectedContent>

      {/* Links apenas para Professional e Owner */}
      <ProtectedContent requiredRole="professional">
        <a href="/agenda">Minha Agenda</a>
        <a href="/atendimentos">Atendimentos</a>
      </ProtectedContent>

      {/* Links apenas para Owner */}
      <ProtectedContent requiredRole="owner">
        <a href="/admin">Painel Admin</a>
        <a href="/relatorios">Relatórios</a>
        <a href="/configuracoes">Configurações</a>
      </ProtectedContent>
    </nav>
  );
}
```

### Dashboard Condicional

```tsx
import { useAuth } from '@/contexts/AuthContext';

function Dashboard() {
  const { hasPermission } = useAuth();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card visível para todos */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3>Meus Agendamentos</h3>
        <p>Ver histórico e status</p>
      </div>

      {/* Card visível apenas para Professional e Owner */}
      {hasPermission('professional') && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3>Agenda Profissional</h3>
          <p>Gerenciar horários</p>
        </div>
      )}

      {/* Card visível apenas para Owner */}
      {hasPermission('owner') && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3>Relatórios</h3>
          <p>Visualizar estatísticas</p>
        </div>
      )}
    </div>
  );
}
```

## 🚫 O que EVITAR

### ❌ NÃO faça isso:
```tsx
// Verificação manual de cada role individual
if (user.activeRole === 'owner' || user.activeRole === 'professional') {
  // mostrar conteúdo
}
```

### ✅ FAÇA isso:
```tsx
// Use a hierarquia automática
if (hasPermission('professional')) {
  // mostrar conteúdo (funciona para professional E owner)
}
```

## 📝 Notas Importantes

1. **Sem necessidade de logout**: O usuário NÃO precisa fazer logout para acessar funcionalidades de diferentes níveis. Se ele tem `activeRole: 'owner'`, ele automaticamente tem acesso a tudo.

2. **Switch de Role**: O usuário pode ter múltiplos roles (`roles: ['client', 'professional', 'owner']`) e trocar entre eles quando quiser, mas cada role já herda as permissões dos níveis inferiores.

3. **Performance**: As verificações de permissão são instantâneas (apenas comparação de números), sem impacto na performance.

4. **Segurança**: Sempre valide permissões tanto no frontend (UX) quanto no backend (Firestore Rules e Cloud Functions).

## 🔄 Migração de Código Existente

Se você já tem código que verifica roles manualmente, pode migrar facilmente:

```tsx
// ANTES
{user?.activeRole === 'professional' && <ProfessionalDashboard />}
{user?.activeRole === 'owner' && <OwnerDashboard />}

// DEPOIS
<ProtectedContent requiredRole="professional">
  <ProfessionalDashboard />
</ProtectedContent>

<ProtectedContent requiredRole="owner">
  <OwnerDashboard />
</ProtectedContent>
```

Agora `ProfessionalDashboard` será visível para professional E owner automaticamente! 🎉
