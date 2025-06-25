import { useState, useCallback } from 'react';
import { UserService } from '../../../shared/services/UserService';
import type { AuthUser } from '@/shared/types/User';
import { config } from '../../../shared/config/config';
import type { UserFilter } from '../components/UserSearchAndFilters';

export function useUserActions() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Estados para diálogo
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  
  // Estados para diálogo de confirmación de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AuthUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await UserService.getAllUsers();
      if (result.success && result.users) {
        setUsers(result.users);
        setStatusMessage(`Cargados ${result.users.length} usuarios desde ${config.APP_MODE === 'local' ? 'RxDB/IndexedDB' : 'Firestore'}`);
      } else {
        setStatusMessage(result.error || 'Error cargando usuarios');
      }
    } catch (error) {
      setStatusMessage('Error inicializando la aplicación');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNewUser = useCallback(() => {
    setDialogMode('create');
    setEditingUser(null);
    setDialogOpen(true);
  }, []);

  const handleEditUser = useCallback((user: AuthUser) => {
    setDialogMode('edit');
    setEditingUser(user);
    setDialogOpen(true);
  }, []);

  const handleDeleteUser = useCallback((user: AuthUser) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDeleteUser = useCallback(async () => {
    if (!userToDelete) return;
    
    setDeleteLoading(true);
    try {
      const result = await UserService.deleteUser(userToDelete.id);
      if (result.success) {
        setStatusMessage(`Usuario ${userToDelete.fullName} eliminado completamente`);
        await loadUsers();
      } else {
        setStatusMessage(result.error || 'Error eliminando usuario');
      }
    } catch (error) {
      console.error('Error:', error);
      setStatusMessage('Error eliminando usuario');
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  }, [userToDelete, loadUsers]);

  const handleDialogSuccess = useCallback(() => {
    loadUsers();
  }, [loadUsers]);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const cancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  }, []);

  // Filtrar usuarios con los criterios de búsqueda y filtros
  const filterUsers = useCallback((allUsers: AuthUser[], searchQuery: string, activeFilter: UserFilter) => {
    let filtered = allUsers;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      );
    }

    if (activeFilter !== 'all') {
      filtered = filtered.filter(user => user.role === activeFilter);
    }

    return filtered;
  }, []);

  // Calcular contadores para los filtros
  const calculateUserCounts = useCallback((allUsers: AuthUser[]) => {
    const counts = {
      all: allUsers.length,
      admin: allUsers.filter(u => u.role === 'admin').length,
      cashier: allUsers.filter(u => u.role === 'cashier').length,
      warehouse: 0,
      vendor: 0,
      accounting: 0
    };
    return counts;
  }, []);

  return {
    // Estados
    users,
    loading,
    statusMessage,
    dialogOpen,
    dialogMode,
    editingUser,
    deleteDialogOpen,
    userToDelete,
    deleteLoading,

    // Funciones
    loadUsers,
    handleNewUser,
    handleEditUser,
    handleDeleteUser,
    confirmDeleteUser,
    handleDialogSuccess,
    closeDialog,
    cancelDelete,
    filterUsers,
    calculateUserCounts
  };
}
