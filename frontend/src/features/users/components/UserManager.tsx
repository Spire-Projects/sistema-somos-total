import React, { useState, useEffect } from 'react';
import { UserService } from '../../../shared/services/UserService';
import { initDatabase } from '../../../shared/db/database';
import type { AuthUser } from '../../../shared/db/models/user.model';
import { config } from '../../../shared/config/config';

export const UserManager: React.FC = () => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'cashier' as 'admin' | 'cashier'
  });

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
        setMessage(`Cargados ${result.users.length} usuarios desde ${config.APP_MODE === 'local' ? 'RxDB/IndexedDB' : 'Firestore'}`);
      } else {
        setMessage(result.error || 'Error cargando usuarios');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error inicializando la aplicación');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await UserService.register(newUser);
      if (result.success) {
        setMessage('Usuario registrado exitosamente');
        setNewUser({ fullName: '', email: '', password: '', role: 'cashier' });
        await loadUsers();
      } else {
        setMessage(result.error || 'Error registrando usuario');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error registrando usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (config.APP_MODE !== 'local') {
      setMessage('Sincronización solo disponible en modo local');
      return;
    }

    setLoading(true);
    try {
      const result = await UserService.syncToFirestore();
      if (result.success) {
        setMessage('Sincronización a Firestore completada');
      } else {
        setMessage(result.error || 'Error en sincronización');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error en sincronización');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Gestión de Usuarios</h2>
      
      {/* Info del modo */}
      <div style={{ 
        background: config.APP_MODE === 'local' ? '#e3f2fd' : '#fff3e0', 
        padding: '10px', 
        borderRadius: '4px', 
        marginBottom: '20px' 
      }}>
        <strong>Modo actual:</strong> {config.APP_MODE} 
        ({config.APP_MODE === 'local' ? 'RxDB/IndexedDB + Backup a Firestore' : 'Solo Firestore'})
      </div>

      {/* Mensaje */}
      {message && (
        <div style={{ 
          background: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {message}
        </div>
      )}

      {/* Formulario de registro */}
      <form onSubmit={handleRegister} style={{ marginBottom: '30px' }}>
        <h3>Registrar nuevo usuario</h3>
        <div style={{ display: 'grid', gap: '10px', maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="Nombre completo"
            value={newUser.fullName}
            onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            required
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'cashier' })}
          >
            <option value="cashier">Cajero</option>
            <option value="admin">Administrador</option>
          </select>
          <button type="submit" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar Usuario'}
          </button>
        </div>
      </form>

      {/* Botones de acción */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={loadUsers} disabled={loading} style={{ marginRight: '10px' }}>
          {loading ? 'Cargando...' : 'Recargar Usuarios'}
        </button>
        
        {config.APP_MODE === 'local' && (
          <button onClick={handleSync} disabled={loading}>
            {loading ? 'Sincronizando...' : 'Sincronizar a Firestore'}
          </button>
        )}
      </div>

      {/* Lista de usuarios */}
      <h3>Usuarios ({users.length})</h3>
      <div style={{ display: 'grid', gap: '10px' }}>
        {users.map((user) => (
          <div
            key={user.id}
            style={{
              border: '1px solid #ddd',
              padding: '10px',
              borderRadius: '4px',
              background: user.active ? '#f9f9f9' : '#ffebee'
            }}
          >
            <div><strong>{user.fullName}</strong> ({user.role})</div>
            <div>{user.email}</div>
            <div>Estado: {user.active ? 'Activo' : 'Inactivo'}</div>
            {user.lastSession && (
              <div>Última sesión: {new Date(user.lastSession).toLocaleString()}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
