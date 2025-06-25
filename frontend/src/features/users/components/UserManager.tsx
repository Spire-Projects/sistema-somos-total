import React, { useState, useEffect, useMemo } from 'react';
import { UserService } from '../../../shared/services/UserService';
import type { AuthUser } from '@/shared/types/User';
import { config } from '../../../shared/config/config';
import { UserSearchAndFilters, type UserFilter } from './UserSearchAndFilters';
import { UserTable } from './UserTable';
import { DataPagination } from '../../../shared/components/DataPagination';
import { UserDialog } from './UserDialog';
import CustomDialog from '../../../shared/components/CustomDialog';

export const UserManager: React.FC = () => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Estados para búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<UserFilter>('all');
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);

  // Estados para diálogo
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  
  // Estados para diálogo de confirmación de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AuthUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
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
  };

  const filteredUsers = useMemo(() => {
    let filtered = users;

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
  }, [users, searchQuery, activeFilter]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, usersPerPage]);

  // Calcular contadores para los filtros
  const userCounts = useMemo(() => {
    const counts = {
      all: users.length,
      admin: users.filter(u => u.role === 'admin').length,
      cashier: users.filter(u => u.role === 'cashier').length,
      warehouse: 0, // Placeholder para futuros roles
      vendor: 0,
      accounting: 0
    };
    return counts;
  }, [users]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (filter: UserFilter) => {
    setActiveFilter(filter);
    setCurrentPage(1); 
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleNewUser = () => {
    setDialogMode('create');
    setEditingUser(null);
    setDialogOpen(true);
  };

  const handleEditUser = (user: AuthUser) => {
    setDialogMode('edit');
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleDeleteUser = (user: AuthUser) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    setDeleteLoading(true);
    try {
      const result = await UserService.deactivateUser(userToDelete.id);
      if (result.success) {
        setStatusMessage(`Usuario ${userToDelete.fullName} desactivado exitosamente`);
        await loadUsers();
      } else {
        setStatusMessage(result.error || 'Error desactivando usuario');
      }
    } catch (error) {
      console.error('Error:', error);
      setStatusMessage('Error desactivando usuario');
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleDialogSuccess = () => {
    loadUsers();
  };

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = Math.min(startIndex + usersPerPage, filteredUsers.length);

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <UserSearchAndFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          onNewUser={handleNewUser}
          userCounts={userCounts}
        />
      </div>
      <div className="mb-4">
        <UserTable
          users={paginatedUsers}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          loading={loading}
        />
      </div>
      {filteredUsers.length > 0 && (
        <DataPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredUsers.length}
          itemsPerPage={usersPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={(newUsersPerPage: number) => {
            setUsersPerPage(newUsersPerPage);
            setCurrentPage(1);
          }}
          startIndex={startIndex}
          endIndex={endIndex}
          itemName="usuarios"
        />
      )}
      <UserDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleDialogSuccess}
        user={editingUser}
        mode={dialogMode}
      />
      
      {/* Diálogo de confirmación para eliminación de usuario */}
      <CustomDialog
        isOpen={deleteDialogOpen}
        onConfirm={confirmDeleteUser}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setUserToDelete(null);
        }}
        textConfirm="Eliminar"
        textCancel="Cancelar"
        title="Eliminar Usuario"
        description={userToDelete ? `¿Estás seguro que deseas eliminar al usuario ${userToDelete.fullName}? Esta acción no se puede deshacer.` : ""}
        loading={deleteLoading}
      />
    </div>
  );
};
