import type { CreateSaleData, SaleState } from "@/shared/types/modelTypes/Sale";


export const generateSaleData = (
  saleState: SaleState,
  userId: string,
  invoiceNumber: string,
  isDraft = false,
  exchangeRateArg?: number
): CreateSaleData => {

  const totalInBs = saleState.paymentCurrency === 'arg' && exchangeRateArg
    ? saleState.total / exchangeRateArg
    : saleState.total;

  const totalWithoutDiscountInBs = saleState.paymentCurrency === 'arg' && exchangeRateArg && saleState.subtotal
    ? saleState.subtotal / exchangeRateArg
    : saleState.subtotal;

  const totalDiscountInBs = saleState.paymentCurrency === 'arg' && exchangeRateArg && saleState.totalDiscount
    ? saleState.totalDiscount / exchangeRateArg
    : saleState.totalDiscount;

  const saleData: CreateSaleData = {
    items: saleState.items.map((item) => ({
      purchaseBoxId: item.purchaseBoxId,
      product: item.product,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      total: item.total,
    })),
    total: totalInBs,
    totalWithoutDiscount: totalWithoutDiscountInBs,
    totalDiscount: totalDiscountInBs,
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
