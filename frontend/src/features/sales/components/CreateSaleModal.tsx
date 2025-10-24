import { memo, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { toast } from "sonner";
import ProductSearchSection from "./ProductSearchSection";
import SaleItemsTable from "./SaleItemsTable";
import ClientSection from "./ClientSection";
import NitSection from "./NitSection";
import SaleNotes from "./SaleNotes";
import PaymentMethodSelector from "./PaymentMethodSelector";
import SaleSummarySection from "./SaleSummarySection";
import SaleSuccessModal from "./SaleSuccessModal";
import type { SaleState, CartSaleItem, CreateSaleData, SaleView } from "@/shared/types/modelTypes/Sale";
import type { Client } from "@/shared/types/Client";
import type { NIT } from "@/shared/types/Nit";
import type { PurchaseBox } from "@/shared/types/modelTypes/PurchaseBox";
import type { Product } from "@/shared/types/modelTypes/Product";
import { salesService } from "@/shared/services/SalesService";
import { InvoiceNumberService } from "@/shared/services/InvoiceNumberService";
import { getPurchaseBoxRepository } from "@/shared/db/repositories/purchase.repository";

interface CreateSaleModalProps {
  open: boolean;
  onClose: () => void;
  onSaleCreated?: () => void;
}

const CreateSaleModal = memo(({ open, onClose, onSaleCreated }: CreateSaleModalProps) => {
  // Estado inicial
  const [saleState, setSaleState] = useState<SaleState>({
    items: [],
    paymentMethod: 'efectivo',
    paymentCurrency: 'bs',
    clientDiscountType: 'percentage',
    clientDiscountValue: 0,
    subtotal: 0,
    totalDiscount: 0,
    total: 0,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedSale, setCompletedSale] = useState<SaleView | null>(null);

  // Calcular totales
  const calculateTotals = useCallback((items: CartSaleItem[], clientDiscountType: 'percentage' | 'fixed', clientDiscountValue: number) => {
    // Calcular subtotal y descuentos de items
    const subtotal = items.reduce((acc, item) => acc + item.originalPrice * item.quantity, 0);
    const itemsDiscount = items.reduce((acc, item) => {
      const discountAmount = item.originalPrice * item.quantity * (item.discount / 100);
      return acc + discountAmount;
    }, 0);

    const subtotalAfterItemsDiscount = subtotal - itemsDiscount;

    // Calcular descuento del cliente
    const clientDiscountAmount = clientDiscountType === 'percentage'
      ? subtotalAfterItemsDiscount * (clientDiscountValue / 100)
      : clientDiscountValue;

    // Total final
    const total = Math.max(0, subtotalAfterItemsDiscount - clientDiscountAmount);
    const totalDiscount = itemsDiscount + clientDiscountAmount;

    return {
      subtotal,
      totalDiscount,
      total,
    };
  }, []);

  // Agregar producto al carrito
  const handleAddProduct = useCallback((purchaseBox: PurchaseBox & { productName?: string; productCode?: string }, product: Product) => {
    // Verificar si el producto ya está en el carrito
    const existingItemIndex = saleState.items.findIndex(
      item => item.purchaseBoxId === purchaseBox.id
    );

    // Calcular precio de venta basado en unitCost y profitMarginPercentage
    const profitMargin = purchaseBox.profitMarginPercentage || 0;
    const sellingPrice = purchaseBox.unitCost * (1 + profitMargin / 100);

    let newItems: CartSaleItem[];

    if (existingItemIndex >= 0) {
      // Si ya existe, incrementar cantidad
      const existingItem = saleState.items[existingItemIndex];
      if (existingItem.quantity >= existingItem.availableStock) {
        toast.warning('No hay más stock disponible para este producto');
        return;
      }

      newItems = [...saleState.items];
      const updatedItem = {
        ...existingItem,
        quantity: existingItem.quantity + 1,
      };
      // Recalcular total del item
      const discountAmount = updatedItem.originalPrice * (updatedItem.discount / 100);
      const unitPriceAfterDiscount = updatedItem.originalPrice - discountAmount;
      updatedItem.unitPrice = unitPriceAfterDiscount;
      updatedItem.total = unitPriceAfterDiscount * updatedItem.quantity;

      newItems[existingItemIndex] = updatedItem;
      toast.success(`Cantidad actualizada: ${updatedItem.productName}`);
    } else {
      // Si no existe, agregar nuevo item
      const newItem: CartSaleItem = {
        purchaseBoxId: purchaseBox.id,
        product: product.id,
        productName: product.name,
        productCode: product.code,
        purchaseDate: purchaseBox.purchaseDate,
        receiptNumber: purchaseBox.receiptNumber,
        quantity: 1,
        unitPrice: sellingPrice,
        discount: 0,
        total: sellingPrice,
        availableStock: purchaseBox.quantity,
        unitCost: purchaseBox.unitCost,
        profitMarginPercentage: purchaseBox.profitMarginPercentage,
        originalPrice: sellingPrice,
      };

      newItems = [...saleState.items, newItem];
      toast.success(`Producto agregado: ${product.name}`);
    }

    // Actualizar estado con nuevos totales
    const totals = calculateTotals(newItems, saleState.clientDiscountType, saleState.clientDiscountValue);
    setSaleState(prev => ({
      ...prev,
      items: newItems,
      ...totals,
    }));
  }, [saleState, calculateTotals]);

  // Actualizar cantidad de un item
  const handleUpdateQuantity = useCallback((purchaseBoxId: string, quantity: number) => {
    const newItems = saleState.items.map(item => {
      if (item.purchaseBoxId === purchaseBoxId) {
        const discountAmount = item.originalPrice * (item.discount / 100);
        const unitPriceAfterDiscount = item.originalPrice - discountAmount;
        
        return {
          ...item,
          quantity,
          unitPrice: unitPriceAfterDiscount,
          total: unitPriceAfterDiscount * quantity,
        };
      }
      return item;
    });

    const totals = calculateTotals(newItems, saleState.clientDiscountType, saleState.clientDiscountValue);
    setSaleState(prev => ({
      ...prev,
      items: newItems,
      ...totals,
    }));
  }, [saleState, calculateTotals]);

  // Actualizar descuento de un item
  const handleUpdateDiscount = useCallback((purchaseBoxId: string, discount: number) => {
    const newItems = saleState.items.map(item => {
      if (item.purchaseBoxId === purchaseBoxId) {
        const discountAmount = item.originalPrice * (discount / 100);
        const unitPriceAfterDiscount = item.originalPrice - discountAmount;
        
        return {
          ...item,
          discount,
          unitPrice: unitPriceAfterDiscount,
          total: unitPriceAfterDiscount * item.quantity,
        };
      }
      return item;
    });

    const totals = calculateTotals(newItems, saleState.clientDiscountType, saleState.clientDiscountValue);
    setSaleState(prev => ({
      ...prev,
      items: newItems,
      ...totals,
    }));
  }, [saleState, calculateTotals]);

  // Eliminar item del carrito
  const handleRemoveItem = useCallback((purchaseBoxId: string) => {
    const newItems = saleState.items.filter(item => item.purchaseBoxId !== purchaseBoxId);
    const totals = calculateTotals(newItems, saleState.clientDiscountType, saleState.clientDiscountValue);
    
    setSaleState(prev => ({
      ...prev,
      items: newItems,
      ...totals,
    }));

    toast.info('Producto eliminado del carrito');
  }, [saleState, calculateTotals]);

  // Manejar selección de cliente
  const handleClientSelect = useCallback((client: Client | null) => {
    setSaleState(prev => ({
      ...prev,
      clientId: client?.id,
      clientName: client?.name,
    }));
  }, []);

  // Manejar selección de NIT
  const handleNitSelect = useCallback((nit: NIT | null) => {
    setSaleState(prev => ({
      ...prev,
      nitClient: nit?.numberNit,
      socialReasonClient: nit?.socialReason,
    }));
  }, []);

  // Manejar cambio de notas
  const handleNotesChange = useCallback((notes: string) => {
    setSaleState(prev => ({
      ...prev,
      saleNotes: notes,
    }));
  }, []);

  // Manejar cambio de método de pago
  const handlePaymentMethodChange = useCallback((method: 'efectivo' | 'qr') => {
    setSaleState(prev => ({
      ...prev,
      paymentMethod: method,
    }));
  }, []);

  // Manejar cambio de descuento del cliente
  const handleClientDiscountChange = useCallback((type: 'percentage' | 'fixed', value: number) => {
    const totals = calculateTotals(saleState.items, type, value);
    
    setSaleState(prev => ({
      ...prev,
      clientDiscountType: type,
      clientDiscountValue: value,
      ...totals,
    }));
  }, [saleState.items, calculateTotals]);

  // Confirmar venta
  const handleConfirmSale = useCallback(async () => {
    if (saleState.items.length === 0) {
      toast.error('Agrega al menos un producto para realizar la venta');
      return;
    }

    setIsProcessing(true);

    try {
      // Obtener número de factura
      const invoiceNumber = await InvoiceNumberService.getNextInvoiceNumber();

      // Preparar datos de la venta
      const saleData: CreateSaleData = {
        items: saleState.items.map(item => ({
          purchaseBoxId: item.purchaseBoxId,
          product: item.product,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          total: item.total,
        })),
        total: saleState.total,
        totalWithoutDiscount: saleState.subtotal,
        totalDiscount: saleState.totalDiscount,
        client: saleState.clientId,
        paymentMethod: saleState.paymentMethod,
        paymentCurrency: saleState.paymentCurrency,
        factured: !!saleState.nitClient,
        nitClient: saleState.nitClient,
        socialReasonClient: saleState.socialReasonClient,
        saleNotes: saleState.saleNotes,
        numberInvoice: invoiceNumber,
        createdBy: 'current-user', // TODO: Get from auth context
      };

      // Crear la venta
      const createdSale = await salesService.create(saleData);

      // Actualizar el stock de cada purchaseBox
      const purchaseRepo = getPurchaseBoxRepository();
      for (const item of saleState.items) {
        const purchaseBox = await purchaseRepo.findById(item.purchaseBoxId);
        if (purchaseBox) {
          const newQuantity = purchaseBox.quantity - item.quantity;
          await purchaseRepo.update(purchaseBox.id, {
            quantity: Math.max(0, newQuantity),
            updatedBy: 'current-user', // TODO: Get from auth context
          });
        }
      }

      // Obtener la vista completa de la venta creada
      const saleView = await salesService.findById(createdSale.id);
      
      if (!saleView) {
        throw new Error('No se pudo cargar la venta creada');
      }

      // Mostrar modal de éxito
      setCompletedSale(saleView);
      setShowSuccessModal(true);

      // Resetear el estado
      setSaleState({
        items: [],
        paymentMethod: 'efectivo',
        paymentCurrency: 'bs',
        clientDiscountType: 'percentage',
        clientDiscountValue: 0,
        subtotal: 0,
        totalDiscount: 0,
        total: 0,
      });

      // Notificar al componente padre
      if (onSaleCreated) {
        onSaleCreated();
      }

      toast.success('¡Venta realizada exitosamente!');
    } catch (error) {
      console.error('Error al crear la venta:', error);
      toast.error('Error al procesar la venta. Por favor, intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  }, [saleState, onSaleCreated]);

  // Cancelar venta
  const handleCancel = useCallback(() => {
    if (saleState.items.length > 0) {
      if (confirm('¿Estás seguro de cancelar la venta? Se perderán todos los items agregados.')) {
        setSaleState({
          items: [],
          paymentMethod: 'efectivo',
          paymentCurrency: 'bs',
          clientDiscountType: 'percentage',
          clientDiscountValue: 0,
          subtotal: 0,
          totalDiscount: 0,
          total: 0,
        });
        onClose();
      }
    } else {
      onClose();
    }
  }, [saleState.items, onClose]);

  // Cerrar modal de éxito
  const handleCloseSuccessModal = useCallback(() => {
    setShowSuccessModal(false);
    setCompletedSale(null);
    onClose();
  }, [onClose]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleCancel}>
        <DialogContent className="max-w-[95vw] h-[95vh] p-0 !min-w-[1200px]">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-2xl">Nueva Venta</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden px-6 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              {/* Columna izquierda y central: Búsqueda y tabla de items */}
              <div className="lg:col-span-2 space-y-4 overflow-y-auto pr-2">
                {/* Buscador de productos */}
                <ProductSearchSection
                  onAddProduct={handleAddProduct}
                  disabled={isProcessing}
                />

                {/* Tabla de items */}
                <SaleItemsTable
                  items={saleState.items}
                  onUpdateQuantity={handleUpdateQuantity}
                  onUpdateDiscount={handleUpdateDiscount}
                  onRemoveItem={handleRemoveItem}
                  disabled={isProcessing}
                />
              </div>

              {/* Columna derecha: Cliente, NIT, Notas, Pago y Resumen */}
              <div className="space-y-4 overflow-y-auto pr-2">
                {/* Cliente */}
                <ClientSection
                  selectedClientId={saleState.clientId}
                  selectedClientName={saleState.clientName}
                  onClientSelect={handleClientSelect}
                />

                {/* NIT */}
                <NitSection
                  selectedNitClient={saleState.nitClient}
                  selectedSocialReasonClient={saleState.socialReasonClient}
                  onNitSelect={handleNitSelect}
                  disabled={isProcessing}
                />

                {/* Notas */}
                <SaleNotes
                  notes={saleState.saleNotes}
                  onNotesChange={handleNotesChange}
                  disabled={isProcessing}
                />

                {/* Método de pago */}
                <PaymentMethodSelector
                  selectedMethod={saleState.paymentMethod}
                  onPaymentMethodChange={handlePaymentMethodChange}
                  disabled={isProcessing}
                />

                {/* Resumen */}
                <SaleSummarySection
                  saleState={saleState}
                  onClientDiscountChange={handleClientDiscountChange}
                  onConfirmSale={handleConfirmSale}
                  onCancel={handleCancel}
                  isProcessing={isProcessing}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de venta exitosa */}
      <SaleSuccessModal
        open={showSuccessModal}
        onClose={handleCloseSuccessModal}
        sale={completedSale}
      />
    </>
  );
});

CreateSaleModal.displayName = 'CreateSaleModal';

export default CreateSaleModal;
