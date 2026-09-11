import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { ClienteLayout } from './layouts/ClienteLayout';
import { AdminCardapioPage } from './pages/AdminCardapioPage';
import { AdminConfigPage } from './pages/AdminConfigPage';
import { AdminMesasPage } from './pages/AdminMesasPage';
import { AdminSalaoPage } from './pages/AdminSalaoPage';
import { AdminFuncionariosPage } from './pages/AdminFuncionariosPage';
import { AdminPerfilPage } from './pages/AdminPerfilPage';
import { AdminReservasMesaPage } from './pages/AdminReservasMesaPage';
import { AdminCuponsPage } from './pages/AdminCuponsPage';
import { EsqueciSenhaPage } from './pages/EsqueciSenhaPage';
import { RequireAuth } from './components/RequireAuth';
import { CardapioPublicoPage } from './pages/CardapioPublicoPage';
import { CarrinhoPage } from './pages/CarrinhoPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PagamentoPage } from './pages/PagamentoPage';
import { AcompanhamentoPage } from './pages/AcompanhamentoPage';
import { HistoricoPedidosPage } from './pages/HistoricoPedidosPage';
import { ReservarPage } from './pages/ReservarPage';
import { ClienteCadastroPage } from './pages/ClienteCadastroPage';
import { ClientePerfilPage } from './pages/ClientePerfilPage';
import { DetalheProdutoPage } from './pages/DetalheProdutoPage';
import { AdminPagamentosPendentesPage } from './pages/AdminPagamentosPendentesPage';
import { AdminPedidoDetalhePage } from './pages/AdminPedidoDetalhePage';
import { EquipeHomePage } from './pages/EquipeHomePage';
import { FuncionarioCadastroPage } from './pages/FuncionarioCadastroPage';
import { BalcaoLayout } from './layouts/BalcaoLayout';
import { CozinhaLayout } from './layouts/CozinhaLayout';
import { BalcaoMesasPage } from './pages/BalcaoMesasPage';
import { BalcaoReservasPage } from './pages/BalcaoReservasPage';
import { BalcaoPedidoPresencialPage } from './pages/BalcaoPedidoPresencialPage';
import { BalcaoRetiradaPage } from './pages/BalcaoRetiradaPage';
import { CozinhaFilaPage } from './pages/CozinhaFilaPage';
import { RequireFuncionario } from './components/RequireFuncionario';
import { FuncionarioPerfilPage } from './pages/FuncionarioPerfilPage';
import { GarcomLayout } from './layouts/GarcomLayout';
import { MotoboyLayout } from './layouts/MotoboyLayout';
import { GarcomComandasPage } from './pages/GarcomComandasPage';
import { GarcomServirPage } from './pages/GarcomServirPage';
import { GarcomDashboardPage } from './pages/GarcomDashboardPage';
import { MotoboyDisponiveisPage } from './pages/MotoboyDisponiveisPage';
import { MotoboyMinhasEntregasPage } from './pages/MotoboyMinhasEntregasPage';
import { MotoboyDashboardPage } from './pages/MotoboyDashboardPage';
import { LoginPage } from './pages/LoginPage';
import { AdminPedidosPage } from './pages/AdminPedidosPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { PedidosAtivosPage } from './pages/PedidosAtivosPage';

function App() {
  return (
    <Routes>

      {/* Site público (Cliente) */}
      <Route path="/" element={<ClienteLayout />}>
        <Route index element={<CardapioPublicoPage />} />
        <Route path="produto/:id" element={<DetalheProdutoPage />} />
        <Route path="carrinho" element={<CarrinhoPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="pagamento/:pedidoId" element={<PagamentoPage />} />
        <Route path="pedido/:pedidoId" element={<AcompanhamentoPage />} />
        <Route path="meus-pedidos" element={<HistoricoPedidosPage />} />
        <Route path="reservar" element={<ReservarPage />} />
        <Route path="login" element={<LoginPage default="cliente" />} />
        <Route path="cadastro" element={<ClienteCadastroPage />} />
        <Route path="perfil" element={<ClientePerfilPage />} />
        <Route path="esqueci-senha" element={<EsqueciSenhaPage />} />
      </Route>

      {/* Painel Admin */}
      <Route path="/admin/login" element={<LoginPage default="admin" />} />

      <Route path="/equipe/login" element={<LoginPage default="equipe" />} />

      <Route
        path="/equipe/balcao"
        element={
          <RequireFuncionario cargos={['balcao']}>
            <BalcaoLayout />
          </RequireFuncionario>
        }
      >
        <Route index element={<Navigate to="mesas" replace />} />
        <Route path="mesas" element={<BalcaoMesasPage />} />
        <Route path="reservas" element={<BalcaoReservasPage />} />
        <Route path="pedido-presencial" element={<BalcaoPedidoPresencialPage />} />
        <Route path="retirada" element={<BalcaoRetiradaPage />} />
        <Route path="ativos" element={<PedidosAtivosPage destaque="retirada" />} />
      </Route>

      <Route
        path="/equipe/cozinha"
        element={
          <RequireFuncionario cargos={['cozinha']}>
            <CozinhaLayout />
          </RequireFuncionario>
        }
      >
        <Route index element={<CozinhaFilaPage />} />
      </Route>

      <Route path="/equipe" element={<EquipeHomePage />} />

      <Route
        path="/equipe/cadastro"
        element={<FuncionarioCadastroPage />}
      />

      <Route
        path="/equipe/perfil"
        element={
          <RequireFuncionario>
            <FuncionarioPerfilPage />
          </RequireFuncionario>
        }
      />

      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="cardapio" replace />} />
        <Route path="cardapio" element={<AdminCardapioPage />} />
        <Route path="config" element={<AdminConfigPage />} />
        <Route path="mesas" element={<AdminMesasPage />} />
        <Route path="salao" element={<AdminSalaoPage />} />
        <Route path="funcionarios" element={<AdminFuncionariosPage />} />
        <Route path="pedidos/:id" element={<AdminPedidoDetalhePage />} />
        <Route path="perfil" element={<AdminPerfilPage />} />
        <Route path="reservas-mesa" element={<AdminReservasMesaPage />} />
        <Route path="cupons" element={<AdminCuponsPage />} />
        <Route path="pagamentos-pendentes" element={<AdminPagamentosPendentesPage />} />
        <Route path="pedidos-ativos" element={<PedidosAtivosPage />} />
        <Route path="pedidos" element={<AdminPedidosPage />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
      </Route>

      <Route
        path="/equipe/garcom"
        element={
          <RequireFuncionario cargos={['garcom']}>
            <GarcomLayout />
          </RequireFuncionario>
        }
      >
        <Route index element={<Navigate to="comandas" replace />} />
        <Route path="comandas" element={<GarcomComandasPage />} />
        <Route path="servir" element={<GarcomServirPage />} />
        <Route path="ativos" element={<PedidosAtivosPage destaque="presencial" permitirAtender />} />
        <Route path="dashboard" element={<GarcomDashboardPage />} />
      </Route>

      <Route
        path="/equipe/motoboy"
        element={
          <RequireFuncionario cargos={['motoboy']}>
            <MotoboyLayout />
          </RequireFuncionario>
        }
      >
        <Route index element={<Navigate to="disponiveis" replace />} />
        <Route path="disponiveis" element={<MotoboyDisponiveisPage />} />
        <Route
          path="minhas-entregas"
          element={<MotoboyMinhasEntregasPage />}
        />
        <Route path="dashboard" element={<MotoboyDashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}

export default App;