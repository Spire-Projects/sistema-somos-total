import React, { useState, useEffect, useMemo } from 'react';
import { UserService } from '../../../shared/services/UserService';
import { initDatabase } from '../../../shared/db/database';
import type { AuthUser } from '@/shared/types/User';
import { config } from '../../../shared/config/config';
import { UserSearchAndFilters, type UserFilter } from './UserSearchAndFilters';
import { UserTable } from './UserTable';
import { DataPagination } from '../../../shared/components/DataPagination';
import { UserDialog } from './UserDialog';

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
  
  // Estados para selección
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Estados para diálogo
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Inicializar la base de datos
      await initDatabase();
      
      const result = await UserService.getAllUsers();
      if (result.success && result.users) {
        setUsers(result.users);
        setStatusMessage(`Cargados ${result.users.length} usuarios desde ${config.APP_MODE === 'local' ? 'RxDB/IndexedDB' : 'Firestore'}`);
      } else {
        setStatusMessage(result.error || 'Error cargando usuarios');
      }
    } catch (error) {
      console.error('Error:', error);
      setStatusMessage('Error inicializando la aplicación');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuarios basado en búsqueda y filtros
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Aplicar filtro de búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      );
    }

    // Aplicar filtro de rol
    if (activeFilter !== 'all') {
      filtered = filtered.filter(user => user.role === activeFilter);
    }

    return filtered;
  }, [users, searchQuery, activeFilter]);

  // Calcular usuarios para la página actual
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

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedUsers([]); // Limpiar selección al cambiar página
  };

  // Manejar cambio de filtro
  const handleFilterChange = (filter: UserFilter) => {
    setActiveFilter(filter);
    setCurrentPage(1); // Resetear a la primera página
    setSelectedUsers([]); // Limpiar selección
  };

  // Manejar búsqueda
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Resetear a la primera página
    setSelectedUsers([]); // Limpiar selección
  };

  // Manejar selección de usuarios
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(paginatedUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  // Manejar diálogos
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

  const handleDeleteUser = async (user: AuthUser) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario ${user.fullName}?`)) {
      try {
        const result = await UserService.deactivateUser(user.id);
        if (result.success) {
          setStatusMessage(`Usuario ${user.fullName} desactivado exitosamente`);
          await loadUsers();
        } else {
          setStatusMessage(result.error || 'Error desactivando usuario');
        }
      } catch (error) {
        console.error('Error:', error);
        setStatusMessage('Error desactivando usuario');
      }
    }
  };

  const handleDialogSuccess = () => {
    loadUsers();
  };

  // Calcular información de paginación
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = Math.min(startIndex + usersPerPage, filteredUsers.length);

  return (
    <div className="container mx-auto p-4 max-w-7xl">

      {/* Búsqueda y filtros */}
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

      {/* Tabla de usuarios */}
      <div className="mb-4">
        <UserTable
          users={paginatedUsers}
          selectedUsers={selectedUsers}
          onSelectUser={handleSelectUser}
          onSelectAll={handleSelectAll}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          loading={loading}
        />
        
        {/* Mensaje de estado para fines de desarrollo 
        TODO: activar cuando se necesite
        {statusMessage && (
          <div className="mt-2 text-sm text-gray-600 italic">
            {statusMessage}
          </div>
        )}
          */}
      </div>

      {/* Paginación */}
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

      {/* Diálogo de crear/editar usuario */}
      <UserDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleDialogSuccess}
        user={editingUser}
        mode={dialogMode}
      />
    </div>
  );
};
