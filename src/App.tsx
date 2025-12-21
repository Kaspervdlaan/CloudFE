import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { Drive } from './pages/Drive/Drive';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useEffect } from 'react';
import { setToken } from './services/authApi';

// Component to handle OAuth callback
function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setToken(token);
      // Remove token from URL for security
      window.history.replaceState({}, '', '/auth/callback');
      checkAuth();
    } else {
      // If no token in URL, try to check auth anyway (might be in cookie)
      checkAuth();
    }
  }, [searchParams, checkAuth]);

  return <Navigate to="/drive" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/drive"
        element={
          <ProtectedRoute>
            <Drive />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
