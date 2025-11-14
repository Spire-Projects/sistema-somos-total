import { memo, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, X } from 'lucide-react';
import type { CreatePurchaseData, PurchaseView, UpdatePurchaseData } from '@/shared/types/modelTypes/PurchaseBox';
import type { Product } from '@/shared/types/modelTypes/Product';
import type { Manufacturer } from '@/shared/types/modelTypes/Manufacturer';
import { purchaseService } from '@/shared/services/PurchaseService';
import { productService } from '@/shared/services/ProductService';
import { manufacturerService } from '@/shared/services/ManufacturerService';
import CreatableSelect from '@/shared/components/CreatableSelect';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Textarea } from '@/shared/components/ui/textarea';

/**
 * Schema de validación para crear una compra
 */
const createPurchaseSchema = z.object({
    productId: z
        .string()
        .min(1, 'El producto es obligatorio'),
    purchaseDate: z
        .string()
        .min(1, 'La fecha de compra es obligatoria'),
    receiptNumber: z
        .string()
        .optional()
        .transform((val) => val?.trim() || undefined),
    quantity: z
        .number({ invalid_type_error: 'La cantidad debe ser un número' })
        .positive('La cantidad debe ser mayor a 0')
        .int('La cantidad debe ser un número entero'),
    unitCost: z
        .number({ invalid_type_error: 'El costo unitario debe ser un número' })
        .positive('El costo unitario debe ser mayor a 0'),
    totalCost: z
        .number({ invalid_type_error: 'El costo total debe ser un número' })
        .positive('El costo total debe ser mayor a 0'),
    supplierId: z
        .string()
        .optional()
        .transform((val) => val?.trim() || undefined),
    profitMarginPercentage: z
        .number({ invalid_type_error: 'El margen debe ser un número' })
        .min(0, 'El margen no puede ser negativo')
        .max(100, 'El margen no puede ser mayor a 100%')
        .optional()
        .nullable()
        .transform((val) => val ?? undefined),
    notes: z
        .string()
        .optional()
        .transform((val) => val?.trim() || undefined),
});

/**
 * Tipos para el formulario
 */
type CreatePurchaseFormDisplay = {
    productId: string;
    purchaseDate: string;
    receiptNumber?: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    supplierId?: string;
    profitMarginPercentage?: number | null;
    notes?: string;
};

interface CreatePurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void | Promise<void>;
    createdBy: string;
    purchaseToEdit?: PurchaseView | null;
}

/**
 * Modal para crear o editar una compra
 */
const CreatePurchaseModalComponent = ({
    isOpen,
    onClose,
    onSuccess,
    createdBy,
    purchaseToEdit = null,
}: CreatePurchaseModalProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [initialProducts, setInitialProducts] = useState<Product[]>([]);
    const [initialManufacturers, setInitialManufacturers] = useState<Manufacturer[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null);
    const [priceMode, setPriceMode] = useState<'auto' | 'manual'>('auto');
    const [manualPrice, setManualPrice] = useState<number>(0);

    // Configurar form con validación
    const form = useForm<CreatePurchaseFormDisplay>({
        resolver: zodResolver(createPurchaseSchema) as any,
        defaultValues: {
            productId: '',
            purchaseDate: new Date().toISOString().split('T')[0],
            receiptNumber: '',
            quantity: 1,
            unitCost: 0,
            totalCost: 0,
            supplierId: '',
            profitMarginPercentage: null,
            notes: '',
        },
        mode: 'onBlur',
    });

    // Efecto para setear valores iniciales si es edición
    useEffect(() => {
        if (isOpen && purchaseToEdit) {
            form.reset({
                productId: purchaseToEdit.productId,
                purchaseDate: purchaseToEdit.purchaseDate.split('T')[0],
                receiptNumber: purchaseToEdit.receiptNumber || '',
                quantity: purchaseToEdit.quantityPurchased,
                unitCost: purchaseToEdit.unitCost,
                totalCost: purchaseToEdit.totalCost,
                supplierId: purchaseToEdit.supplierId || '',
                profitMarginPercentage: purchaseToEdit.profitMarginPercentage ?? null,
                notes: purchaseToEdit.notes || '',
            });

            // Cargar producto seleccionado
            if (purchaseToEdit.productId) {
                productService.findById(purchaseToEdit.productId).then(product => {
                    if (product) setSelectedProduct(product);
                });
            }

            // Cargar proveedor seleccionado
            if (purchaseToEdit.supplierId) {
                manufacturerService.findById(purchaseToEdit.supplierId).then(manufacturer => {
                    if (manufacturer) setSelectedManufacturer(manufacturer);
                });
            }
        } else if (isOpen && !purchaseToEdit) {
            const today = new Date().toISOString().split('T')[0];
            form.reset({
                productId: '',
                purchaseDate: today,
                receiptNumber: '',
                quantity: 1,
                unitCost: 0,
                totalCost: 0,
                supplierId: '',
                profitMarginPercentage: null,
                notes: '',
            });
            setSelectedProduct(null);
            setSelectedManufacturer(null);
            setPriceMode('auto');
            setManualPrice(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, purchaseToEdit]);

    /**
     * Cargar datos iniciales
     */
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [productsResponse, manufacturersResponse] = await Promise.all([
                    productService.getAllView(1, 20),
                    manufacturerService.getAllView(1, 20),
                ]);
                setInitialProducts(productsResponse.items);
                setInitialManufacturers(manufacturersResponse.items);
            } catch (error) {
                console.error('Error loading initial data:', error);
            }
        };
        loadInitialData();
    }, []);

    /**
     * Función de búsqueda para productos
     */
    const searchProducts = useCallback(async (searchQuery: string) => {
        try {
            const response = await productService.getAllView(1, 20, searchQuery);
            return response.items;
        } catch (error) {
            console.error('Error searching products:', error);
            return [];
        }
    }, []);

    /**
     * Función de búsqueda para proveedores
     */
    const searchManufacturers = useCallback(async (searchQuery: string) => {
        try {
            const response = await manufacturerService.getAllView(1, 20, searchQuery);
            return response.items;
        } catch (error) {
            console.error('Error searching manufacturers:', error);
            return [];
        }
    }, []);

    /**
     * Función para crear nuevo proveedor
     */
    const handleCreateManufacturer = useCallback(async (name: string): Promise<Manufacturer> => {
        try {
            const newManufacturer = await manufacturerService.create({
                name: name.trim(),
                createdBy,
            });
            setInitialManufacturers(prev => [newManufacturer, ...prev]);
            return newManufacturer;
        } catch (error) {
            console.error('Error creating manufacturer:', error);
            throw error;
        }
    }, [createdBy]);

    /**
     * Manejar selección de producto
     */
    const handleProductChange = useCallback((product: Product) => {
        setSelectedProduct(product);
        form.setValue('productId', product.id);
    }, [form]);

    /**
     * Manejar selección de proveedor
     */
    const handleManufacturerChange = useCallback((manufacturer: Manufacturer) => {
        setSelectedManufacturer(manufacturer);
        form.setValue('supplierId', manufacturer.id);
    }, [form]);

    /**
     * Calcular costo total cuando cambian cantidad o costo unitario
     */
    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === 'quantity' || name === 'unitCost') {
                const quantity = value.quantity || 0;
                const unitCost = value.unitCost || 0;
                const totalCost = quantity * unitCost;
                form.setValue('totalCost', totalCost, { shouldValidate: false });
            }

            // Si el modo es manual y cambia el precio, recalcular el margen
            if (priceMode === 'manual' && (name === 'unitCost')) {
                const unitCost = value.unitCost || 0;
                if (unitCost > 0 && manualPrice > unitCost) {
                    const calculatedMargin = ((manualPrice - unitCost) / unitCost) * 100;
                    form.setValue('profitMarginPercentage', calculatedMargin, { shouldValidate: false });
                }
            }
        });
        return () => subscription.unsubscribe();
    }, [form, priceMode, manualPrice]);

    /**
     * Limpiar estado cuando el modal se cierra
     */
    useEffect(() => {
        if (!isOpen) {
            const timeoutId = setTimeout(() => {
                form.reset();
                setSubmitError(null);
                setSuccessMessage(null);
                setSelectedProduct(null);
                setSelectedManufacturer(null);
                setPriceMode('auto');
                setManualPrice(0);
            }, 200);

            return () => clearTimeout(timeoutId);
        }
    }, [isOpen, form]);

    /**
     * Manejar envío del formulario
     */
    const onSubmit = useCallback(
        async (data: CreatePurchaseFormDisplay) => {
            try {
                setSubmitError(null);
                setSuccessMessage(null);
                setIsSubmitting(true);

                if (purchaseToEdit) {
                    // Modo edición
                    const updateData: UpdatePurchaseData = {
                        productId: data.productId,
                        purchaseDate: new Date(data.purchaseDate).toISOString(),
                        receiptNumber: data.receiptNumber,
                        quantityPurchased: data.quantity,
                        quantityAvailable: purchaseToEdit.quantityAvailable + (data.quantity - purchaseToEdit.quantityPurchased),
                        unitCost: data.unitCost,
                        totalCost: data.totalCost,
                        supplierId: data.supplierId,
                        profitMarginPercentage: data.profitMarginPercentage ?? undefined,
                        notes: data.notes,
                        updatedBy: createdBy,
                    };
                    await purchaseService.update(purchaseToEdit.id, updateData);
                    setSuccessMessage(`Compra actualizada exitosamente`);
                } else {
                    // Modo creación
                    const createData: CreatePurchaseData = {
                        productId: data.productId,
                        purchaseDate: new Date(data.purchaseDate).toISOString(),
                        receiptNumber: data.receiptNumber,
                        quantityPurchased: data.quantity,
                        unitCost: data.unitCost,
                        totalCost: data.totalCost,
                        supplierId: data.supplierId,
                        profitMarginPercentage: data.profitMarginPercentage ?? undefined,
                        notes: data.notes,
                        createdBy,
                    };
                    await purchaseService.create(createData);
                    setSuccessMessage(`Compra registrada exitosamente`);
                }

                // Esperar un poco para que el usuario vea el mensaje
                await new Promise((resolve) => setTimeout(resolve, 800));

                // Limpiar y cerrar
                form.reset();
                setSubmitError(null);
                setSuccessMessage(null);
                setSelectedProduct(null);
                setSelectedManufacturer(null);
                setPriceMode('auto');
                setManualPrice(0);

                // Llamar callback de éxito
                if (onSuccess) {
                    await onSuccess();
                }

                // Cerrar modal
                onClose();
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                setSubmitError(errorMessage);
                console.error(purchaseToEdit ? 'Error updating purchase:' : 'Error creating purchase:', error);
            } finally {
                setIsSubmitting(false);
            }
        },
        [createdBy, form, onClose, onSuccess, purchaseToEdit]
    );

    /**
     * Manejar cierre del modal
     */
    const handleClose = useCallback(() => {
        if (!isSubmitting) {
            form.reset();
            setSubmitError(null);
            setSuccessMessage(null);
            setSelectedProduct(null);
            setSelectedManufacturer(null);
            setPriceMode('auto');
            setManualPrice(0);
            onClose();
        }
    }, [isSubmitting, form, onClose]);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>{purchaseToEdit ? 'Editar Compra' : 'Registrar Nueva Compra'}</span>
                        
                    </DialogTitle>
                    <DialogDescription>
                        {purchaseToEdit
                            ? 'Actualiza la información de la compra'
                            : 'Completa el formulario para registrar una nueva compra'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Mensajes de error */}
                        {submitError && (
                            <Alert variant="destructive">
                                <AlertDescription>{submitError}</AlertDescription>
                            </Alert>
                        )}

                        {/* Mensajes de éxito */}
                        {successMessage && (
                            <Alert className="bg-green-50 border-green-200">
                                <AlertDescription className="text-green-800">
                                    ✓ {successMessage}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Grid de formulario */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Producto */}
                            <FormField
                                control={form.control}
                                name="productId"
                                render={({ field: _field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Producto *</FormLabel>
                                        <FormControl>
                                            <CreatableSelect<Product>
                                                label=""
                                                values={initialProducts}
                                                selectedValue={selectedProduct}
                                                onChange={handleProductChange}
                                                searchFunction={searchProducts}
                                                displayField="name"
                                                valueField="id"
                                                placeholder="Seleccionar producto..."
                                                hideLabel={true}
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Selecciona el producto comprado
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Fecha de compra */}
                            <FormField
                                control={form.control}
                                name="purchaseDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha de Compra *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                disabled={isSubmitting}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Fecha en que se realizó la compra
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Número de comprobante */}
                            <FormField
                                control={form.control}
                                name="receiptNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nº Comprobante</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="F-001-00123"
                                                disabled={isSubmitting}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Número de comprobante
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Cantidad */}
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cantidad *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="1"
                                                step="1"
                                                placeholder="0"
                                                disabled={isSubmitting}
                                                {...field}
                                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Cantidad de unidades compradas
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Costo unitario */}
                            <FormField
                                control={form.control}
                                name="unitCost"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Costo Unitario (Bs) *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                disabled={isSubmitting}
                                                {...field}
                                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Costo por unidad
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Costo total (calculado) */}
                            <FormField
                                control={form.control}
                                name="totalCost"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Costo Total (Bs)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                disabled={true}
                                                {...field}
                                                className="bg-gray-50 font-semibold"
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Calculado automáticamente
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {/* Proveedor */}
                            <FormField
                                control={form.control}
                                name="supplierId"
                                render={({ field: _field }) => (
                                    <FormItem className="">
                                        <FormLabel>Proveedor</FormLabel>
                                        <FormControl>
                                            <CreatableSelect<Manufacturer>
                                                label=""
                                                values={initialManufacturers}
                                                selectedValue={selectedManufacturer}
                                                onChange={handleManufacturerChange}
                                                searchFunction={searchManufacturers}
                                                onAddValue={handleCreateManufacturer}
                                                displayField="name"
                                                valueField="id"
                                                placeholder="Seleccionar proveedor..."
                                                hideLabel={true}
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Suminitrador del producto
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Margen de ganancia + Precio de venta sugerido juntos */}
                            <div className="md:col-span-2 flex flex-col gap-3">
                                <FormField
                                    control={form.control}
                                    name="profitMarginPercentage"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Margen de Ganancia (%)</FormLabel>
                                            <FormControl>
                                                <div className="space-y-2">
                                                    {/* Toggle entre automático y manual */}
                                                    <div className="flex gap-2 mb-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setPriceMode('auto')}
                                                            className={`px-3 py-1 text-xs rounded-md transition-colors ${priceMode === 'auto'
                                                                    ? 'bg-blue-500 text-white'
                                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                }`}
                                                        >
                                                            Automático
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setPriceMode('manual')}
                                                            className={`px-3 py-1 text-xs rounded-md transition-colors ${priceMode === 'manual'
                                                                    ? 'bg-purple-500 text-white'
                                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                }`}
                                                        >
                                                            Manual
                                                        </button>
                                                    </div>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.1"
                                                        placeholder="0.0"
                                                        disabled={isSubmitting || priceMode === 'manual'}
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            field.onChange(val === '' ? null : parseFloat(val));
                                                        }}
                                                        className={priceMode === 'manual' ? 'bg-gray-100' : ''}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                {priceMode === 'auto'
                                                    ? 'Porcentaje de ganancia esperada'
                                                    : 'Calculado automáticamente según precio manual'}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {/* Precio de venta sugerido dinámico */}
                                {(() => {
                                    const unitCost = form.watch('unitCost') || 0;
                                    const margin = form.watch('profitMarginPercentage') || 0;

                                    // Calcular precio según el modo
                                    let priceBs = 0;
                                    if (priceMode === 'auto') {
                                        priceBs = unitCost + (unitCost * margin / 100);
                                    } else {
                                        priceBs = manualPrice;
                                    }

                                    // Precio de venta unitario en ARS
                                    const priceArs = priceBs / 0.0047;

                                    if (!unitCost || unitCost <= 0) return null;

                                    return (
                                        <div className="rounded-lg border-2 border-gray-200 p-4 bg-linear-to-br ">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="font-semibold text-blue-900"> Precio de Venta </div>
                                                {priceMode === 'auto' && (
                                                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                                                        Automático
                                                    </span>
                                                )}
                                                {priceMode === 'manual' && (
                                                    <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">
                                                        Manual
                                                    </span>
                                                )}
                                            </div>

                                            {priceMode === 'manual' && (
                                                <div className="mb-3">
                                                    <label className="text-sm text-gray-700 mb-1 block">Precio de venta (Bs)</label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        disabled={isSubmitting}
                                                        value={manualPrice || ''}
                                                        onChange={e => {
                                                            const price = parseFloat(e.target.value) || 0;
                                                            setManualPrice(price);
                                                            // Recalcular margen
                                                            if (unitCost > 0 && price > unitCost) {
                                                                const calculatedMargin = ((price - unitCost) / unitCost) * 100;
                                                                form.setValue('profitMarginPercentage', calculatedMargin);
                                                            } else {
                                                                form.setValue('profitMarginPercentage', 0);
                                                            }
                                                        }}
                                                        className="font-mono text-lg"
                                                    />
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white rounded-md p-3 shadow-sm border border-blue-100">
                                                    <div className="text-xs text-gray-600 mb-1">Bolivianos (Bs)</div>
                                                    <div className="font-mono text-2xl font-bold text-blue-700">
                                                        {priceBs.toFixed(2)}
                                                    </div>
                                                </div>
                                                <div className="bg-white rounded-md p-3 shadow-sm border border-purple-100">
                                                    <div className="text-xs text-gray-600 mb-1">Pesos (ARS)</div>
                                                    <div className="font-mono text-2xl font-bold text-purple-700">
                                                        {priceArs.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3 text-xs text-gray-500 text-center">
                                                Tasa de cambio: 1 ARS = 0.0047 Bs
                                            </div>

                                            {margin > 0 && (
                                                <div className="mt-3 pt-3 border-t border-blue-200">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Margen de ganancia:</span>
                                                        <span className="font-semibold text-green-600">{margin.toFixed(2)}%</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm mt-1">
                                                        <span className="text-gray-600">Ganancia por unidad:</span>
                                                        <span className="font-semibold text-green-600">
                                                            Bs {(priceBs - unitCost).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>



                            {/* Notas */}
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Notas</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Información adicional sobre la compra..."
                                                disabled={isSubmitting}
                                                rows={3}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Observaciones adicionales (opcional)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Botones de acción */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="gap-2"
                            >
                                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                {isSubmitting
                                    ? (purchaseToEdit ? 'Actualizando...' : 'Registrando...')
                                    : (purchaseToEdit ? 'Actualizar Compra' : 'Registrar Compra')}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

CreatePurchaseModalComponent.displayName = 'CreatePurchaseModal';

export const CreatePurchaseModal = memo(CreatePurchaseModalComponent);
