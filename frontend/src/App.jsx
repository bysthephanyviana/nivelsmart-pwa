import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import CondominiosPage from './pages/condominios/CondominiosPage';
import CondominioFormPage from './pages/condominios/CondominioFormPage';
import WizardCondominio from './pages/condominios/WizardCondominio';
import ReservatoriosPage from './pages/reservatorios/ReservatoriosPage';
import ReservatorioDetail from './pages/reservatorios/ReservatorioDetail';
import ReservatorioFormPage from './pages/reservatorios/ReservatorioFormPage';
import SensoresList from './pages/sensores/SensoresList';
import SensorFormPage from './pages/sensores/SensorFormPage';
import AddSensorPage from './pages/sensores/AddSensorPage';
import ProfilePage from './pages/profile/ProfilePage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" reverseOrder={false} />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<CondominiosPage />} />

            {/* CRUD Condominios */}
            <Route path="condominios/novo" element={<WizardCondominio />} />
            <Route path="condominios/simples" element={<CondominioFormPage />} />
            <Route path="condominios/editar/:id" element={<CondominioFormPage />} />

            {/* CRUD Reservatorios */}
            <Route path="condominio/:id" element={<ReservatoriosPage />} />
            <Route path="reservatorios/novo" element={<ReservatorioFormPage />} />
            <Route path="reservatorios/editar/:id" element={<ReservatorioFormPage />} />

            {/* CRUD Sensores */}
            <Route path="sensores" element={<SensoresList />} />
            <Route path="sensores/editar/:id" element={<SensorFormPage />} />
            <Route path="sensor/:id" element={<ReservatorioDetail />} /> {/* Detail View */}

            <Route path="perfil" element={<ProfilePage />} />
            <Route path="sensores/novo" element={<AddSensorPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
