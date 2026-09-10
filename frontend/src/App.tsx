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
import { LoginPage } from './pages/LoginPage';
import { EsqueciSenhaPage } from './pages/EsqueciSenhaPage';
import { RequireAuth } from './components/RequireAuth';
import { CardapioPublicoPage } from './pages/CardapioPublicoPage';
import { CarrinhoPage } from './pages/CarrinhoPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PagamentoPage } from './pages/PagamentoPage';
import { AcompanhamentoPage } from './pages/AcompanhamentoPage';
import { HistoricoPedidosPage } from './pages/HistoricoPedidosPage';
import { ReservarPage } from './pages/ReservarPage';
import { ClienteLoginPage } from './pages/ClienteLoginPage';
import { ClienteCadastroPage } from './pages/ClienteCadastroPage';
import { ClientePerfilPage } from './pages/ClientePerfilPage';
import { DetalheProdutoPage } from './pages/DetalheProdutoPage';
import { AdminPagamentosPendentesPage } from './pages/AdminPagamentosPendentesPage';
import { AdminPedidoDetalhePage } from './pages/AdminPedidoDetalhePage';
import { FuncionarioLoginPage } from './pages/FuncionarioLoginPage';
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
 <Route path="login" element={<ClienteLoginPage />} />
 <Route path="cadastro" element={<ClienteCadastroPage />} />
 <Route path="perfil" element={<ClientePerfilPage />} />
 <Route path="esqueci-senha" element={<EsqueciSenhaPage />} />
 </Route>

 {/* Painel Admin */}
 <Route path="/admin/login" element={<LoginPage />} />
 <Route path="/equipe/login" element={<FuncionarioLoginPage />} />
 <Route path="/equipe/balcao" element={<RequireFuncionario cargos={['balcao']}><BalcaoLayout /></RequireFuncionario>}>
  <Route index element={<Navigate to="mesas" replace />} />
  <Route path="mesas" element={<BalcaoMesasPage />} />
  <Route path="reservas" element={<BalcaoReservasPage />} />
  <Route path="pedido-presencial" element={<BalcaoPedidoPresencialPage />} />
  <Route path="retirada" element={<BalcaoRetiradaPage />} />
</Route>
<Route path="/equipe/cozinha" element={<RequireFuncionario cargos={['cozinha']}><CozinhaLayout /></RequireFuncionario>}>
  <Route index element={<CozinhaFilaPage />} />
</Route>
<Route path="/equipe" element={<EquipeHomePage />} />
<Route path="/equipe/cadastro" element={<FuncionarioCadastroPage />} />
 <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
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
 </Route>
 <Route path="*" element={<Navigate to="/" replace />} />
 </Routes>
 );
}
export default App;