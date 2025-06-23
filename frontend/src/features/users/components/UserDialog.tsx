import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../shared/components/ui/dialog';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/ui/select';
import { UserService } from '../../../shared/services/UserService';
import type { AuthUser, UserRole } from '../../../shared/types/User';

interface UserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: AuthUser | null;
  mode: 'create' | 'edit';
}

interface UserFormData {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  active: boolean;
}

export const UserDialog: React.FC<UserDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
  mode
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    fullName: '',
    email: '',
    password: '',
    role: 'cashier',
    active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && user) {
        setFormData({
          fullName: user.fullName,
          email: user.email,
          password: '', // No prellenar contraseña por seguridad
          role: user.role,
          active: user.active
        });
      } else {
        setFormData({
          fullName: '',
          email: '',
          password: '',
          role: 'cashier',
          active: true
        });
      }
      setError(null);
    }
  }, [isOpen, mode, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'create') {
        const result = await UserService.register({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: formData.role
        });

        if (result.success) {
          onSuccess();
          onClose();
        } else {
          setError(result.error || 'Error creando usuario');
        }
      } else if (mode === 'edit' && user) {
        const updateData: any = {
          fullName: formData.fullName,
          email: formData.email,
          role: formData.role,
          active: formData.active
        };

        // Solo incluir contraseña si se proporcionó una nueva
        if (formData.password.trim()) {
          // Aquí necesitarías un método updateUser que maneje el hash de contraseña
          // Por ahora solo actualizamos los otros campos
        }

        const result = await UserService.updateUser(user.id, updateData);

        if (result.success) {
          onSuccess();
          onClose();
        } else {
          setError(result.error || 'Error actualizando usuario');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error procesando la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'admin', label: 'Administrador' },
    { value: 'cashier', label: 'Caja' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Completa la información para crear un nuevo usuario'
              : 'Modifica la información del usuario'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre completo */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre completo *</Label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Ej: Juan Pérez"
              required
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="juan.perez@farmaapp.com"
              required
              disabled={loading}
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Contraseña {mode === 'create' ? '*' : '(dejar vacío para mantener actual)'}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required={mode === 'create'}
              disabled={loading}
            />
          </div>

          {/* Rol */}
          <div className="space-y-2">
            <Label htmlFor="role">Rol *</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estado (solo en modo edición) */}
          {mode === 'edit' && (
            <div className="space-y-2">
              <Label htmlFor="active">Estado</Label>
              <Select 
                value={formData.active ? 'active' : 'inactive'} 
                onValueChange={(value) => setFormData({ ...formData, active: value === 'active' })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              variant="default"
            >
              {loading ? 'Procesando...' : (mode === 'create' ? 'Crear Usuario' : 'Guardar Cambios')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
