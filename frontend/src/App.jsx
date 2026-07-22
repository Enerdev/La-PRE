import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RutaProtegida from './components/RutaProtegida';
import LoginPage from './pages/LoginPage';
import ScannerPage from './pages/ScannerPage';
import MiQrPage from './pages/MiQrPage';
import DashboardPage from './pages/DashboardPage';
import PagosPage from './pages/PagosPage';
import RankingsPage from './pages/RankingsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/escaner"
            element={
              <RutaProtegida rolesPermitidos={['personal_asistencia', 'administrador_sede']}>
                <ScannerPage />
              </RutaProtegida>
            }
          />

          <Route
            path="/mi-qr"
            element={
              <RutaProtegida rolesPermitidos={['estudiante']}>
                <MiQrPage />
              </RutaProtegida>
            }
          />

          <Route
            path="/panel"
            element={
              <RutaProtegida rolesPermitidos={['direccion', 'administrador_sede']}>
                <DashboardPage />
              </RutaProtegida>
            }
          />

          <Route
            path="/pagos"
            element={
              <RutaProtegida rolesPermitidos={['direccion', 'administrador_sede']}>
                <PagosPage />
              </RutaProtegida>
            }
          />

          <Route
            path="/rankings"
            element={
              <RutaProtegida rolesPermitidos={['direccion', 'administrador_sede']}>
                <RankingsPage />
              </RutaProtegida>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
