// Interfaces para los modelos de la aplicación (ya definidas en database.ts)
// Mantener este archivo para futuras referencias o expandir con más modelos
// Ejemplo de cómo sería un esquema de producto para validación
export const productValidationSchema = {
    type: 'object',
    required: ['name', 'price'],
    properties: {
        name: { type: 'string', minLength: 1 },
        description: { type: 'string' },
        price: { type: 'number', minimum: 0 },
        stock: { type: 'number', minimum: 0 },
        category: { type: 'string' }
    }
};
