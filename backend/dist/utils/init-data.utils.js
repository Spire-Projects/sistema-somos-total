import { dbHelpers } from '../db/database.js';
import { hashPassword } from '../utils/auth.utils.js';
import { v4 as uuidv4 } from 'uuid';
export const initializeDefaultData = async () => {
    try {
        console.log('Verificando datos por defecto...');
        // Verificar si ya existe un usuario administrador
        const existingAdmin = await dbHelpers.users.getByEmail('admin@farmaapp.com');
        if (!existingAdmin) {
            console.log('Creando usuario administrador por defecto...');
            // Crear usuario administrador por defecto
            const adminPassword = await hashPassword('admin123');
            const adminUser = {
                id: uuidv4(),
                fullName: 'Administrador del Sistema',
                email: 'admin@farmaapp.com',
                passwordHash: adminPassword,
                role: 'admin',
                active: true,
                createdAt: new Date().toISOString()
            };
            await dbHelpers.users.create(adminUser);
            console.log('Usuario administrador creado:');
            console.log('Email: admin@farmaapp.com');
            console.log('Contraseña: admin123');
            console.log('¡IMPORTANTE: Cambia esta contraseña en producción!');
        }
        else {
            console.log('Usuario administrador ya existe.');
        }
        // Verificar si ya existe un usuario cajero de ejemplo
        const existingCashier = await dbHelpers.users.getByEmail('cajero@farmaapp.com');
        if (!existingCashier) {
            console.log('Creando usuario cajero de ejemplo...');
            const cashierPassword = await hashPassword('cajero123');
            const cashierUser = {
                id: uuidv4(),
                fullName: 'Cajero de Ejemplo',
                email: 'cajero@farmaapp.com',
                passwordHash: cashierPassword,
                role: 'cashier',
                active: true,
                createdAt: new Date().toISOString()
            };
            await dbHelpers.users.create(cashierUser);
            console.log('Usuario cajero creado:');
            console.log('Email: cajero@farmaapp.com');
            console.log('Contraseña: cajero123');
        }
        else {
            console.log('Usuario cajero ya existe.');
        }
        console.log('Inicialización de datos completada.');
    }
    catch (error) {
        console.error('Error al inicializar datos por defecto:', error);
        throw error;
    }
};
