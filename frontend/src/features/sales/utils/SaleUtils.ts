import type { CreateSaleData, SaleState } from "@/shared/types/modelTypes/Sale";


export const generateSaleData = (
  saleState: SaleState,
  userId: string,
  invoiceNumber: string,
  isDraft = false
): CreateSaleData => {
  const saleData: CreateSaleData = {
    items: saleState.items.map((item) => ({
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
    createdBy: userId,
    isDraft
  };
  return saleData;
};
