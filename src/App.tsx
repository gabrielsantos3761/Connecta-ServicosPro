import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/layout/Layout'
import { ProfissionalLayout } from './components/layout/ProfissionalLayout'
import { AppLayout } from './components/layout/AppLayout'
import { Dashboard } from './pages/Dashboard'
import DashboardFinanceiro from './pages/DashboardFinanceiro'
import DashboardVendas from './pages/DashboardVendas'
import { DashboardProfissionais } from './pages/DashboardProfissionais'
import { DashboardServicos } from './pages/DashboardServicos'
import { DashboardClientes } from './pages/DashboardClientes'
import { DashboardAgendamentos } from './pages/DashboardAgendamentos'
import { Agendamentos } from './pages/Agendamentos'
import { Servicos } from './pages/Servicos'
import { Profissionais } from './pages/Profissionais'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { ClienteDashboard } from './pages/ClienteDashboard'
import { Home } from './pages/Home'
import { EmpresasPorCategoria } from './pages/EmpresasPorCategoria'
import { EmpresaDetalhes } from './pages/EmpresaDetalhes'
import { SelecionarEmpresa } from './pages/SelecionarEmpresa'
import { Checkout } from './pages/Checkout'
import { ConfirmacaoAgendamento } from './pages/ConfirmacaoAgendamento'
import { ProfissionalDashboard } from './pages/ProfissionalDashboard'
import { ProfissionalAssociarBarbearia } from './pages/ProfissionalAssociarBarbearia'
import { Perfil } from './pages/Perfil'
import { CompleteProfile } from './pages/CompleteProfile'
import { ConfiguracoesEstabelecimento } from './pages/ConfiguracoesEstabelecimento'
import { EntradaDespesas } from './pages/EntradaDespesas'
import { CadastrarEstabelecimento } from './pages/CadastrarEstabelecimento'
import { Toaster } from './components/ui/toaster'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster />
        <Routes>
          {/* Rotas de Autenticação (SEM header) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rotas Públicas com AppLayout (header global) */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/profile/complete" element={<CompleteProfile />} />
            <Route path="/categorias/:categoryId" element={<EmpresasPorCategoria />} />
            <Route path="/empresas/:businessId" element={<EmpresaDetalhes />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/confirmacao-agendamento" element={<ConfirmacaoAgendamento />} />

          </Route>

          {/* Rotas do Cliente */}
          <Route
            path="/cliente"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <ClienteDashboard />
              </ProtectedRoute>
            }
          />

          {/* Rotas do Profissional - com ProfissionalLayout (sidebar próprio) */}
          <Route
            path="/profissional"
            element={
              <ProtectedRoute allowedRoles={['professional']}>
                <ProfissionalLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ProfissionalDashboard />} />
            <Route path="associar-barbearia" element={<ProfissionalAssociarBarbearia />} />
          </Route>

          {/* Rota de Seleção de Empresa (Proprietário) */}
          <Route
            path="/selecionar-empresa"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <SelecionarEmpresa />
              </ProtectedRoute>
            }
          />

          {/* Rota de Cadastro de Estabelecimento (Proprietário) */}
          <Route
            path="/cadastrar-estabelecimento"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <CadastrarEstabelecimento />
              </ProtectedRoute>
            }
          />

          {/* Rotas do Proprietário (Admin) - Dashboard da Empresa Selecionada */}
          <Route
            path="/:businessId/dashboard"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="financeiro" element={<DashboardFinanceiro />} />
            <Route path="vendas" element={<DashboardVendas />} />
            <Route path="profissionais" element={<DashboardProfissionais />} />
            <Route path="servicos" element={<DashboardServicos />} />
            <Route path="clientes" element={<DashboardClientes />} />
            <Route path="agendamentos" element={<DashboardAgendamentos />} />
            <Route path="configuracoes" element={<ConfiguracoesEstabelecimento />} />
          </Route>

          {/* Rotas antigas de gerenciamento (agora dentro do dashboard) */}
          <Route
            path="/:businessId/entrada-despesas"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<EntradaDespesas />} />
          </Route>
          <Route
            path="/:businessId/agendamentos"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Agendamentos />} />
          </Route>
          <Route
            path="/:businessId/servicos"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Servicos />} />
          </Route>
          <Route
            path="/:businessId/profissionais"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Profissionais />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
