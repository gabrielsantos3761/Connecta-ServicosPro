import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/layout/Layout'
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
import { ProfissionalPerfil } from './pages/ProfissionalPerfil'
import { ProfissionalAssociarBarbearia } from './pages/ProfissionalAssociarBarbearia'
import { Perfil } from './pages/Perfil'

function App() {
  return (
    <Router basename="/Connecta-ServicosPro">
      <AuthProvider>
        <Routes>
          {/* Rotas Públicas com AppLayout (header global) */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/perfil" element={<Perfil />} />
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

          {/* Rotas do Profissional */}
          <Route
            path="/profissional/associar-barbearia"
            element={
              <ProtectedRoute allowedRoles={['professional']}>
                <ProfissionalAssociarBarbearia />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profissional"
            element={
              <ProtectedRoute allowedRoles={['professional']}>
                <ProfissionalDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profissional/perfil"
            element={
              <ProtectedRoute allowedRoles={['professional']}>
                <ProfissionalPerfil />
              </ProtectedRoute>
            }
          />

          {/* Rota de Seleção de Empresa (Proprietário) */}
          <Route
            path="/selecionar-empresa"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <SelecionarEmpresa />
              </ProtectedRoute>
            }
          />

          {/* Rotas do Proprietário (Admin) - Dashboard da Empresa Selecionada */}
          <Route
            path="/dashboard"
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
          </Route>

          {/* Rotas antigas de gerenciamento (agora dentro do dashboard) */}
          <Route
            path="/agendamentos"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Agendamentos />} />
          </Route>
          <Route
            path="/servicos"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Servicos />} />
          </Route>
          <Route
            path="/profissionais"
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
