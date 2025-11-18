import { memo, useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import CustomDialog from "@/shared/components/CustomDialog";
import { toast } from "sonner";
import ProductSearchSection from "./SaleSection/ProductSearchSection";
import SaleItemsTable from "./SaleItemsTable";
import ClientSection from "./SaleSection/ClientSection";
import NitSection from "./SaleSection/NitSection";
import SaleNotes from "./SaleSection/SaleNotesSection";
import PaymentMethodSelector from "./PaymentMethodSelector";
import CurrencySelector from "./CurrencySelector";
import SaleSummarySection from "./SaleSection/SaleSummarySection";
import type {
  SaleState,
  CartSaleItem,
  SaleView,
} from "@/shared/types/modelTypes/Sale";
import type { Client } from "@/shared/types/Client";
import type { NIT } from "@/shared/types/Nit";
import type { PurchaseView } from "@/shared/types/modelTypes/PurchaseBox";
import type { ProductView } from "@/shared/types/modelTypes/Product";
import { salesService } from "@/shared/services/SalesService";
import { InvoiceNumberService } from "@/shared/services/InvoiceNumberService";
import SaleSuccessDialog from "./SaleSuccessDialog";
import { purchaseService } from "@/shared/services/PurchaseService";
import { Button } from "@/shared/components/ui/button";
import { Printer } from "lucide-react";
import { generateSaleData, recreateSaleStateItems } from "../utils/SaleUtils";
import { QuotationPreviewModal } from "./QuotationPreviewModal";
import useGlobalStates from "@/shared/hooks/useGlobalStates";
import VerifyStockQuotationModal from "./VerifyStockQuotationModal";
import { 
  quotationStockVerificationService,
  type StockIssue 
} from "../services/QuotationStockVerificationService";

interface CreateSaleModalProps {
  open: boolean;
  onClose: () => void;
  initialSaleId?: string;
  onSaleCreated?: () => void;
}

const CreateSaleModal = memo(
  ({ open, onClose, onSaleCreated, initialSaleId }: CreateSaleModalProps) => {
    // Estado inicial
    const [saleState, setSaleState] = useState<SaleState>({
      items: [],
      paymentMethod: "efectivo",
      paymentCurrency: "bs",
      clientDiscountType: "percentage",
      clientDiscountValue: 0,
      subtotal: 0,
      totalDiscount: 0,
      total: 0,
    });

    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [completedSale, setCompletedSale] = useState<SaleView | null>(null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showStockVerificationModal, setShowStockVerificationModal] = useState(false);
    const [stockIssues, setStockIssues] = useState<StockIssue[]>([]);
    const { currency, user } = useGlobalStates();
    
    useEffect(() => {
      if (initialSaleId && open) {
        const loadQuotation = async () => {
          try {
            const saleView = await salesService.findById(initialSaleId);
            
            if (saleView) {
              // Verificar stock de la cotización
              const verification = await quotationStockVerificationService.verifyQuotationStock(saleView);
              
              if (verification.hasIssues) {
                // Hay problemas de stock
                setStockIssues(verification.issues);
                setShowStockVerificationModal(true);
                
                // Cargar solo los items válidos
                const validItems = await recreateSaleStateItems(
                  { ...saleView, items: verification.validItems },
                  currency!
                );
                
                setSaleState({
                  items: validItems,
                  paymentMethod: saleView.paymentMethod,
                  paymentCurrency: saleView.paymentCurrency,
                  clientDiscountType: "percentage",
                  clientDiscountValue: 0,
                  subtotal: saleView.paymentCurrency === "arg" 
                    ? saleView.total * (currency?.equivalenceToBs || 1) 
                    : saleView.total,
                  totalDiscount: 0,
                  total: saleView.paymentCurrency === "arg" 
                    ? saleView.total * (currency?.equivalenceToBs || 1) 
                    : saleView.total,
                  clientId: undefined,
                  clientName: saleView.client,
                  nitClient: saleView.nitClient,
                  socialReasonClient: saleView.socialReasonClient,
                  saleNotes: saleView.saleNotes,
                });
              } else {
                // Todo está bien, cargar normalmente
                const items = await recreateSaleStateItems(saleView, currency!);
                
                setSaleState({
                  items,
                  paymentMethod: saleView.paymentMethod,
                  paymentCurrency: saleView.paymentCurrency,
                  clientDiscountType: "percentage",
                  clientDiscountValue: 0,
                  subtotal: saleView.paymentCurrency === "arg" 
                    ? saleView.total * (currency?.equivalenceToBs || 1) 
                    : saleView.total,
                  totalDiscount: 0,
                  total: saleView.paymentCurrency === "arg" 
                    ? saleView.total * (currency?.equivalenceToBs || 1) 
                    : saleView.total,
                  clientId: undefined,
                  clientName: saleView.client,
                  nitClient: saleView.nitClient,
                  socialReasonClient: saleView.socialReasonClient,
                  saleNotes: saleView.saleNotes,
                });
              }
            }
          } catch (error) {
            console.error("Error al cargar la cotización:", error);
            toast.error("No se pudo cargar la cotización. Intenta nuevamente.");
          }
        };

        loadQuotation();
      }
    }, [initialSaleId, open, currency]);

    const calculateTotals = useCallback(
      (
        items: CartSaleItem[],
        clientDiscountType: "percentage" | "fixed",
        clientDiscountValue: number
      ) => {
        console.log("Modal:Items in calculateTotals:", items);
        const subtotal = items.reduce(
          (acc, item) => acc + item.originalPrice * item.quantity,
          0
        );
        const itemsDiscount = items.reduce((acc, item) => {
          const discountAmount =
            item.originalPrice * item.quantity * (item.discount / 100);
          return acc + discountAmount;
        }, 0);

        const subtotalAfterItemsDiscount = subtotal - itemsDiscount;
        const clientDiscountAmount =
          clientDiscountType === "percentage"
            ? subtotalAfterItemsDiscount * (clientDiscountValue / 100)
            : clientDiscountValue;

        // Total final
        const total = Math.max(
          0,
          subtotalAfterItemsDiscount - clientDiscountAmount
        );
        const totalDiscount = itemsDiscount + clientDiscountAmount;

        return {
          subtotal,
          totalDiscount,
          total,
        };
      },
      []
    );

    const handleAddProduct = useCallback(
      (purchaseView: PurchaseView, product: ProductView) => {
        const existingItemIndex = saleState.items.findIndex(
          (item) => item.purchaseBoxId === purchaseView.id
        );

        const profitMargin = purchaseView.profitMarginPercentage || 0;
        const sellingPrice = purchaseView.unitCost * (1 + profitMargin / 100);

        let newItems: CartSaleItem[];

        if (existingItemIndex >= 0) {
          const existingItem = saleState.items[existingItemIndex];
          if (existingItem.quantity >= existingItem.availableStock) {
            toast.warning("No hay más stock disponible para este producto");
            return;
          }

          newItems = [...saleState.items];
          const updatedItem = {
            ...existingItem,
            quantity: existingItem.quantity + 1,
          };

          const discountAmount =
            updatedItem.originalPrice * (updatedItem.discount / 100);
          const unitPriceAfterDiscount =
            updatedItem.originalPrice - discountAmount;
          updatedItem.unitPrice = unitPriceAfterDiscount;
          updatedItem.total = unitPriceAfterDiscount * updatedItem.quantity;

          newItems[existingItemIndex] = updatedItem;
          toast.success(`Cantidad actualizada: ${updatedItem.productName}`);
        } else {
          const newItem: CartSaleItem = {
            purchaseBoxId: purchaseView.id,
            product: product.id,
            productName: product.name,
            productCode: product.code,
            purchaseDate: purchaseView.purchaseDate,
            receiptNumber: purchaseView.receiptNumber || "",
            quantity: 1,
            unitPrice: sellingPrice,
            discount: 0,
            total: sellingPrice,
            availableStock: purchaseView.quantityAvailable,
            unitCost: purchaseView.unitCost,
            profitMarginPercentage: purchaseView.profitMarginPercentage,
            originalPrice: sellingPrice,
          };

          newItems = [...saleState.items, newItem];
          toast.success(`Producto agregado: ${product.name}`);
        }

        // Actualizar estado con nuevos totales
        const totals = calculateTotals(
          newItems,
          saleState.clientDiscountType,
          saleState.clientDiscountValue
        );
        setSaleState((prev) => ({
          ...prev,
          items: newItems,
          ...totals,
        }));
      },
      [saleState, calculateTotals]
    );

    const handleUpdateQuantity = useCallback(
      (purchaseBoxId: string, quantity: number) => {
        const newItems = saleState.items.map((item) => {
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

        const totals = calculateTotals(
          newItems,
          saleState.clientDiscountType,
          saleState.clientDiscountValue
        );
        setSaleState((prev) => ({
          ...prev,
          items: newItems,
          ...totals,
        }));
      },
      [saleState, calculateTotals]
    );

    // Eliminar item del carrito
    const handleRemoveItem = useCallback(
      (purchaseBoxId: string) => {
        const newItems = saleState.items.filter(
          (item) => item.purchaseBoxId !== purchaseBoxId
        );
        const totals = calculateTotals(
          newItems,
          saleState.clientDiscountType,
          saleState.clientDiscountValue
        );

        setSaleState((prev) => ({
          ...prev,
          items: newItems,
          ...totals,
        }));

        toast.info("Producto eliminado del carrito");
      },
      [saleState, calculateTotals]
    );

    // Manejar selección de cliente
    const handleClientSelect = useCallback((client: Client | null) => {
      setSaleState((prev) => ({
        ...prev,
        clientId: client?.id,
        clientName: client?.name,
      }));
    }, []);

    // Manejar selección de NIT
    const handleNitSelect = useCallback((nit: NIT | null) => {
      setSaleState((prev) => ({
        ...prev,
        nitClient: nit?.numberNit,
        socialReasonClient: nit?.socialReason,
      }));
    }, []);

    // Manejar cambio de notas
    const handleNotesChange = useCallback((notes: string) => {
      setSaleState((prev) => ({
        ...prev,
        saleNotes: notes,
      }));
    }, []);

    // Manejar cambio de método de pago
    const handlePaymentMethodChange = useCallback(
      (method: "efectivo" | "qr") => {
        setSaleState((prev) => ({
          ...prev,
          paymentMethod: method,
        }));
      },
      []
    );

    // Manejar cambio de moneda
    const handleCurrencyChange = useCallback((currency: "bs" | "arg") => {
      setSaleState((prev) => ({
        ...prev,
        paymentCurrency: currency,
      }));
    }, []);

    // Manejar cambio de descuento del cliente
    const handleClientDiscountChange = useCallback(
      (type: "percentage" | "fixed", value: number) => {
        let discountValue = value;
        const totals = calculateTotals(saleState.items, type, discountValue);
        console.log("Modal:Calculating totals with discount:", type, discountValue, totals);
        setSaleState((prev) => ({
          ...prev,
          clientDiscountType: type,
          clientDiscountValue: value,
          ...totals,
        }));
      },
      [saleState.items, calculateTotals, saleState.paymentCurrency]
    );

    const handleSaveQuotation = useCallback(async () => {
      console.log("Guardando cotización con id:", initialSaleId);
      const sale = await salesService.findById(initialSaleId || "");

      const uniqueQuotationId = sale?.numberInvoice || `Q${Date.now().toString(36)}${Math.random()
        .toString(36)
        .slice(2, 7)}`;
      const saleData = generateSaleData(
        saleState,
        user?.id || "current-user",
        uniqueQuotationId,
        true,
        currency?.equivalenceToBs ?? 1
      );
      console.log("Datos de la cotización:", saleData);
      if (initialSaleId) {
        await salesService.update(initialSaleId, saleData);
        toast.success("¡Cotización actualizada exitosamente!");
      } else {
        await salesService.create(saleData);
      }
      handleReset();
      onClose();
    }, [saleState, initialSaleId]);

    const handleConfirmSale = useCallback(async () => {
      if (saleState.items.length === 0) {
        toast.error("Agrega al menos un producto para realizar la venta");
        return;
      }

      setIsProcessing(true);

      try {
        const invoiceNumber = await InvoiceNumberService.getNextInvoiceNumber();
        const saleData = generateSaleData(
          saleState,
          "Current-user",
          invoiceNumber,
          false,
          currency?.equivalenceToBs ?? 1
        );
        if (initialSaleId) {
          await salesService.delete(initialSaleId);
        }
        const createdSale = await salesService.create(saleData);

        for (const item of saleState.items) {
          const purchaseBox = await purchaseService.findById(
            item.purchaseBoxId
          );
          if (purchaseBox) {
            console.log("Updating purchase box:", purchaseBox.id);
            const newQuantity = purchaseBox.quantityAvailable - item.quantity;
            const pw = await purchaseService.update(purchaseBox.id, {
              quantityAvailable: Math.max(0, newQuantity),
              updatedBy: "current-user", // TODO: Get from auth context
            });
            console.log("Purchase box updated new quantity:", newQuantity);
            console.log("Update result:", pw);
          } else {
            console.warn(
              `No se encontró el PurchaseBox con id: ${item.purchaseBoxId}`
            );
          }
        }

        const saleView = await salesService.findById(createdSale.id);

        if (!saleView) {
          throw new Error("No se pudo cargar la venta creada");
        }

        // Mostrar modal de éxito
        setCompletedSale(saleView);
        setShowSuccessModal(true);

        // Resetear el estado
        handleReset();

        if (onSaleCreated) {
          onSaleCreated();
        }

        toast.success("¡Venta realizada exitosamente!");
      } catch (error) {
        console.error("Error al crear la venta:", error);
        toast.error(
          "Error al procesar la venta. Por favor, intenta nuevamente."
        );
      } finally {
        setIsProcessing(false);
      }
    }, [saleState, onSaleCreated]);

    const handleReset = useCallback(() => {
      setSaleState({
        items: [],
        paymentMethod: "efectivo",
        paymentCurrency: "bs",
        clientDiscountType: "percentage",
        clientDiscountValue: 0,
        subtotal: 0,
        totalDiscount: 0,
        total: 0,
      });
    }, []);
    // Cancelar venta
    const handleCancel = useCallback(() => {
      if (saleState.items.length > 0 && !initialSaleId) {
        setShowCancelDialog(true);
      } else {
        onClose();
        handleReset();
      }
    }, [saleState.items, onClose]);

    // Confirmar cancelación de venta
    const handleConfirmCancel = useCallback(() => {
      handleReset();
      setShowCancelDialog(false);
      onClose();
    }, [onClose, handleReset]);

    // Cerrar modal de éxito
    const handleCloseSuccessModal = useCallback(() => {
      setShowSuccessModal(false);
      setCompletedSale(null);
      onClose();
    }, [onClose]);

    // Manejar continuación sin productos con problemas de stock
    const handleContinueWithoutStockIssues = useCallback(() => {
      setShowStockVerificationModal(false);
      toast.info(`Se eliminaron ${stockIssues.length} producto(s) sin stock disponible`);
    }, [stockIssues.length]);

    // Manejar cancelación de verificación de stock
    const handleCancelStockVerification = useCallback(() => {
      setShowStockVerificationModal(false);
      handleReset();
      onClose();
    }, [onClose, handleReset]);

    useEffect(() => {
          console.log("Modal: SaleState total changed:", saleState.total);
          console.log("Modal: Currency equivalence:", currency?.equivalenceToBs);
        }, [saleState.total]);

    return (
      <>
        <Dialog open={open} onOpenChange={handleCancel}>
          <DialogContent className="max-w-[95vw] h-[95vh] p-0 min-w-[85vw]!">
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
                    onRemoveItem={handleRemoveItem}
                    disabled={isProcessing}
                    saleState={saleState}
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

                  {/* Selector de moneda */}
                  <CurrencySelector
                    selectedCurrency={saleState.paymentCurrency}
                    onCurrencyChange={handleCurrencyChange}
                    disabled={isProcessing}
                  />

                  {/* Resumen */}
                  <SaleSummarySection
                    saleState={saleState}
                    onClientDiscountChange={handleClientDiscountChange}
                    onConfirmSale={handleConfirmSale}
                    onSaveQuotation={handleSaveQuotation}
                    onCancel={handleCancel}
                    isProcessing={isProcessing}
                  />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <CustomDialog
          isOpen={showCancelDialog}
          onConfirm={handleConfirmCancel}
          onCancel={() => setShowCancelDialog(false)}
          title="¿Cancelar venta?"
          description="¿Estás seguro de cancelar la venta? Se perderán todos los items agregados."
          textConfirm="Sí, cancelar"
          textCancel="No, continuar"
        />

        <SaleSuccessDialog
          open={showSuccessModal}
          onClose={handleCloseSuccessModal}
          sale={completedSale}
        />

        <VerifyStockQuotationModal
          open={showStockVerificationModal}
          issues={stockIssues}
          onContinueWithoutIssues={handleContinueWithoutStockIssues}
          onCancel={handleCancelStockVerification}
        />
      </>
    );
  }
);

CreateSaleModal.displayName = "CreateSaleModal";

export default CreateSaleModal;
