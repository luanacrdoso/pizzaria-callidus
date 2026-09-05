import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminCardapioPage } from './pages/AdminCardapioPage';
import { AdminConfigPage } from './pages/AdminConfigPage';
import { AdminMesasPage } from './pages/AdminMesasPage';

function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="cardapio" replace />} />
        <Route path="cardapio" element={<AdminCardapioPage />} />
        <Route path="config" element={<AdminConfigPage />} />
        <Route path="mesas" element={<AdminMesasPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default App;