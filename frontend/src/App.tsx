import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminCardapioPage } from './pages/AdminCardapioPage';
import { AdminConfigPage } from './pages/AdminConfigPage';
import { AdminMesasPage } from './pages/AdminMesasPage';
import { AdminSalaoPage } from './pages/AdminSalaoPage';
import { AdminFuncionariosPage } from './pages/AdminFuncionariosPage';
import { AdminPerfilPage } from './pages/AdminPerfilPage';
import { LoginPage } from './pages/LoginPage';
import { EsqueciSenhaPage } from './pages/EsqueciSenhaPage';
import { RequireAuth } from './components/RequireAuth';
import { AdminReservasMesaPage } from './pages/AdminReservasMesaPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/esqueci-senha" element={<EsqueciSenhaPage />} />
      <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
        <Route index element={<Navigate to="cardapio" replace />} />
        <Route path="cardapio" element={<AdminCardapioPage />} />
        <Route path="config" element={<AdminConfigPage />} />
        <Route path="mesas" element={<AdminMesasPage />} />
        <Route path="salao" element={<AdminSalaoPage />} />
        <Route path="reservas-mesa" element={<AdminReservasMesaPage />} />
        <Route path="funcionarios" element={<AdminFuncionariosPage />} />
        <Route path="perfil" element={<AdminPerfilPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default App;