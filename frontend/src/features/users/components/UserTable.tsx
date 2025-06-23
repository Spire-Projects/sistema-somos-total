import React from 'react';
import { Edit, Trash2, Key } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../shared/components/ui/table';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Avatar, AvatarFallback } from '../../../shared/components/ui/avatar';
import { Checkbox } from '../../../shared/components/ui/checkbox';
import type { AuthUser } from '../../../shared/types/User';
import { formatDate, formatDateTime } from '@/shared/utils/date.utils';

interface UserTableProps {
  users: AuthUser[];
  selectedUsers: string[];
  onSelectUser: (userId: string) => void;
  onSelectAll: (checked: boolean) => void;
  onEditUser: (user: AuthUser) => void;
  onDeleteUser: (user: AuthUser) => void;
  loading?: boolean;
}

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'admin':
      return 'destructive';
    case 'cashier':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'admin':
      return 'Administrador';
    case 'cashier':
      return 'Farmacéutico';
    default:
      return role;
  }
};
  
 

const getInitials = (fullName: string) => {
  return fullName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const UserTable: React.FC<UserTableProps> = ({
  users,
  selectedUsers,
  onSelectUser,
  onSelectAll,
  onEditUser,
  onDeleteUser,
  loading = false
}) => {
  const allSelected = users.length > 0 && selectedUsers.length === users.length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Tabla para desktop */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                  aria-label="Seleccionar todos"
                />
              </TableHead>
              <TableHead>USUARIO</TableHead>
              <TableHead>ROL</TableHead>
              <TableHead>CORREO</TableHead>
              <TableHead>ÚLTIMO ACCESO</TableHead>
              <TableHead>FECHA DE REGISTRO</TableHead>
              <TableHead>ESTADO</TableHead>
              <TableHead className="w-32">ACCIONES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => onSelectUser(user.id)}
                    aria-label={`Seleccionar ${user.fullName}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.fullName}</div>
                      <div className="text-sm text-gray-500">@{user.fullName.toLowerCase().replace(/\s+/g, '.')}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {getRoleLabel(user.role)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{user.email}</TableCell>
                <TableCell className="text-sm">{formatDateTime(user.lastSession)}</TableCell>
                <TableCell className="text-sm">{formatDate(user.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant={user.active ? 'default' : 'secondary'}>
                    {user.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditUser(user)}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteUser(user)}
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Vista de tarjetas para móvil */}
      <div className="md:hidden">
        <div className="p-4 border-b bg-gray-50">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onSelectAll}
            className="mr-2"
          />
          <span className="text-sm font-medium">Seleccionar todos</span>
        </div>
        <div className="divide-y">
          {users.map((user) => (
            <div key={user.id} className="p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={() => onSelectUser(user.id)}
                  className="mt-1"
                />
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gray-100 text-gray-600">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 truncate">{user.fullName}</p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Badge variant={user.active ? 'default' : 'secondary'}>
                      {user.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditUser(user)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteUser(user)}
                        className="h-8 w-8 text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    <div>Último acceso: {formatDateTime(user.lastSession)}</div>
                    <div>Registro: {formatDate(user.createdAt)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No se encontraron usuarios
        </div>
      )}
    </div>
  );
};
