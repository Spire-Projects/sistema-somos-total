import { memo, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, X } from 'lucide-react';
import type { CreateProductData } from '@/shared/types/modelTypes/Product';
import { productService } from '@/shared/services/ProductService';
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

/**
 * Schema de validación para crear un producto
 */
const createProductSchema = z.object({
  code: z
    .string()
    .min(1, 'El código es obligatorio')
    .min(3, 'El código debe tener al menos 3 caracteres')
    .max(50, 'El código no puede exceder 50 caracteres')
    .transform((val) => val.trim().toUpperCase()),
  name: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(200, 'El nombre no puede exceder 200 caracteres')
    .transform((val) => val.trim()),
  category: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined),
  description: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined),
});

/**
 * Tipos para el formulario de creación de productos
 */
type CreateProductFormDisplay = {
  code: string;
  name: string;
  category?: string;
  description?: string;
};

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
  createdBy: string;
}

/**
 * Modal para crear un nuevo producto
 * Utiliza React Hook Forms, Zod para validación y shadcn components
 */
const CreateProductModalComponent = ({
  isOpen,
  onClose,
  onSuccess,
  createdBy,
}: CreateProductModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Configurar form con validación
  const form = useForm<CreateProductFormDisplay>({
    resolver: zodResolver(createProductSchema) as any,
    defaultValues: {
      code: '',
      name: '',
      category: '',
      description: '',
    },
    mode: 'onBlur', // Validar solo al perder el foco para mejor UX
  });

  /**
   * Limpiar estado cuando el modal se cierra
   */
  useEffect(() => {
    if (!isOpen) {
      // Reset form después de un pequeño delay para evitar parpadeos
      const timeoutId = setTimeout(() => {
        form.reset();
        setSubmitError(null);
        setSuccessMessage(null);
      }, 200);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, form]);

  /**
   * Manejar envío del formulario
   */
  const onSubmit = useCallback(
    async (data: CreateProductFormDisplay) => {
      try {
        setSubmitError(null);
        setSuccessMessage(null);
        setIsSubmitting(true);

        // Preparar datos para el servicio
        const createData: CreateProductData = {
          code: data.code,
          name: data.name,
          category: data.category,
          createdBy,
        };

        // Crear producto usando el servicio
        await productService.create(createData);

        // Mostrar éxito
        setSuccessMessage(`Producto "${data.name}" creado exitosamente`);

        // Esperar un poco para que el usuario vea el mensaje
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Limpiar y cerrar
        form.reset();
        setSubmitError(null);
        setSuccessMessage(null);

        // Llamar callback de éxito
        if (onSuccess) {
          await onSuccess();
        }

        // Cerrar modal
        onClose();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        setSubmitError(errorMessage);
        console.error('Error creating product:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [createdBy, form, onClose, onSuccess]
  );

  /**
   * Manejar cierre del modal
   */
  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      form.reset();
      setSubmitError(null);
      setSuccessMessage(null);
      onClose();
    }
  }, [isSubmitting, form, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Crear Nuevo Producto</span>
            {!isSubmitting && (
              <button
                onClick={handleClose}
                className="p-1 hover:bg-accent rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </DialogTitle>
          <DialogDescription>
            Completa el formulario para agregar un nuevo producto al inventario
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
            <div className="grid grid-cols-1 gap-6">
              {/* Código del Producto */}
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código del Producto *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="PROD001"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Identificador único (se convertirá a mayúsculas)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nombre del Producto */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Producto *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Laptop Dell XPS 13"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Nombre descriptivo del producto
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Categoría */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Electrónicos"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Clasificación del producto (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Descripción */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Descripción detallada del producto"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Información adicional del producto (opcional)
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
                {isSubmitting ? 'Creando...' : 'Crear Producto'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

CreateProductModalComponent.displayName = 'CreateProductModal';

export const CreateProductModal = memo(CreateProductModalComponent);
