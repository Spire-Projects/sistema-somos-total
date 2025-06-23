import { useState } from 'react';
import { Navigate } from 'react-router';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import logoImage from '../../../assets/logo.png';

import { Button } from '../../../shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { UserService } from '../../../shared/services/UserService';
import { useAppDispatch, useAppSelector } from '../../../shared/store/hooks';
import { loginSuccess } from '../../../shared/store/authSlice';
import type { LoginCredentials } from '../../../shared/db/models/user.model';

export const LoginPage = () => {
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  // Si ya está autenticado, redirigir al dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const response = await UserService.login(formData);

    if (response.success && response.user && response.token) {
      dispatch(
        loginSuccess({
          user: response.user,
          token: response.token,
        })
      );
    } else {
      setError(
        response.error || 'Credenciales inválidas. Por favor, inténtalo de nuevo.'
      );
    }

    setIsLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <img src={logoImage} alt="FarmaApp Logo" className="h-16 w-auto" />
          </div>
          <CardDescription>Iniciar Sesión</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Credenciales de prueba */}
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md mb-4 text-sm">
              <h4 className="font-medium mb-1">Credenciales de prueba:</h4>
              <div className="space-y-1">
                <p><strong>Email:</strong> admin@farmaapp.com</p>
                <p><strong>Contraseña:</strong> admin123</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                required
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-2 -translate-y-1/2 h-7 w-7 text-gray-500"
                  onClick={togglePasswordVisibility}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full bg-red-300" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
