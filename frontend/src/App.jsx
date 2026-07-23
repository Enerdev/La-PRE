import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import RutaProtegida from './components/RutaProtegida';
import LoginPage from './pages/LoginPage';
import ScannerPage from './pages/ScannerPage';
import MiQrPage from './pages/MiQrPage';
import MisResultadosPage from './pages/MisResultadosPage';
import MisPagosPage from './pages/MisPagosPage';
import DashboardPage from './pages/DashboardPage';
import PagosPage from './pages/PagosPage';
import RankingsPage from './pages/RankingsPage';
import EstudiantesPage from './pages/EstudiantesPage';
import SedesPage from './pages/SedesPage';
import AuditoriaPage from './pages/AuditoriaPage';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
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
            path="/mis-resultados"
            element={
              <RutaProtegida rolesPermitidos={['estudiante']}>
                <MisResultadosPage />
              </RutaProtegida>
            }
          />

          <Route
            path="/mis-pagos"
            element={
              <RutaProtegida rolesPermitidos={['estudiante']}>
                <MisPagosPage />
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

          <Route
            path="/estudiantes"
            element={
              <RutaProtegida rolesPermitidos={['direccion', 'administrador_sede']}>
                <EstudiantesPage />
              </RutaProtegida>
            }
          />

          <Route
            path="/sedes"
            element={
              <RutaProtegida rolesPermitidos={['direccion', 'administrador_sede']}>
                <SedesPage />
              </RutaProtegida>
            }
          />

          <Route
            path="/auditoria"
            element={
              <RutaProtegida rolesPermitidos={['direccion']}>
                <AuditoriaPage />
              </RutaProtegida>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
