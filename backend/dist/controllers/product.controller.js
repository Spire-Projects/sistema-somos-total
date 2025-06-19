import { dbHelpers } from '../db/database.js';
// Obtener todos los productos con soporte para paginación y filtrado por categoría
export const getAllProducts = async (req, res) => {
    try {
        // Extraer parámetros de consulta
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const category = req.query.category;
        // Obtener todos los productos
        let products = await dbHelpers.products.getAll();
        // Filtrar por categoría si se proporciona
        if (category) {
            products = products.filter(product => product.category && product.category.toLowerCase() === category.toLowerCase());
        }
        // Calcular total y paginación
        const total = products.length;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;
        // Aplicar paginación
        const paginatedProducts = products.slice(offset, offset + limit);
        // Preparar la respuesta
        const response = {
            products: paginatedProducts,
            pagination: {
                total,
                page,
                limit,
                totalPages
            }
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({
            message: 'Error al obtener productos',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
// Obtener un producto por ID
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await dbHelpers.products.getById(id);
        if (!product) {
            res.status(404).json({ message: 'Producto no encontrado' });
            return;
        }
        res.status(200).json(product);
    }
    catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({
            message: 'Error al obtener producto',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
// Crear un nuevo producto
export const createProduct = async (req, res) => {
    try {
        const productData = req.body;
        // Validar datos mínimos
        if (!productData.name || !productData.price) {
            res.status(400).json({ message: 'Nombre y precio son requeridos' });
            return;
        }
        // Validar que el precio sea un número positivo
        if (typeof productData.price !== 'number' || productData.price <= 0) {
            res.status(400).json({ message: 'El precio debe ser un número positivo' });
            return;
        }
        // Validar stock si se proporciona
        if (productData.stock !== undefined && (typeof productData.stock !== 'number' || productData.stock < 0)) {
            res.status(400).json({ message: 'El stock debe ser un número no negativo' });
            return;
        }
        const newProduct = await dbHelpers.products.create(productData);
        res.status(201).json(newProduct);
    }
    catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({
            message: 'Error al crear producto',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
// Actualizar un producto
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const productData = req.body;
        // Verificar que el producto existe
        const existingProduct = await dbHelpers.products.getById(id);
        if (!existingProduct) {
            res.status(404).json({ message: 'Producto no encontrado' });
            return;
        }
        // Validar precio si se proporciona
        if (productData.price !== undefined && (typeof productData.price !== 'number' || productData.price <= 0)) {
            res.status(400).json({ message: 'El precio debe ser un número positivo' });
            return;
        }
        // Validar stock si se proporciona
        if (productData.stock !== undefined && (typeof productData.stock !== 'number' || productData.stock < 0)) {
            res.status(400).json({ message: 'El stock debe ser un número no negativo' });
            return;
        }
        const updatedProduct = await dbHelpers.products.update(id, productData);
        res.status(200).json(updatedProduct);
    }
    catch (error) {
        console.error('Error al actualizar producto:', error);
        if (error instanceof Error && error.message === 'Producto no encontrado') {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: 'Error al actualizar producto',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
// Eliminar un producto
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        // Verificar que el producto existe
        const existingProduct = await dbHelpers.products.getById(id);
        if (!existingProduct) {
            res.status(404).json({ message: 'Producto no encontrado' });
            return;
        }
        await dbHelpers.products.delete(id);
        res.status(200).json({
            message: 'Producto eliminado correctamente',
            id
        });
    }
    catch (error) {
        console.error('Error al eliminar producto:', error);
        if (error instanceof Error && error.message === 'Producto no encontrado') {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: 'Error al eliminar producto',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
// Buscar productos
export const searchProducts = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || typeof query !== 'string') {
            res.status(400).json({ message: 'Se requiere un término de búsqueda' });
            return;
        }
        const products = await dbHelpers.products.search(query);
        res.status(200).json(products);
    }
    catch (error) {
        console.error('Error al buscar productos:', error);
        res.status(500).json({
            message: 'Error al buscar productos',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
