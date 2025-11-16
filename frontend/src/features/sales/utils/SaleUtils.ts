import Decimal from "decimal.js";
import type {
  CartSaleItem,
  CreateSaleData,
  SaleState,
  SaleView,
} from "@/shared/types/modelTypes/Sale";
import { purchaseService } from "@/shared/services/PurchaseService";
import type { Currency } from "@/shared/types/modelTypes/Currency";

export const formatCurrency = (
  value: number | string,
  currency: "bs" | "arg"
) => {
  const symbol = currency === "bs" ? "Bs" : "ARS";
  return `${symbol} ${new Decimal(value).toFixed(2)}`;
};

export const canConfirmSale = (
  saleState: import("@/shared/types/modelTypes/Sale").SaleState,
  isProcessing: boolean
) => {
  return saleState.items.length > 0 && !isProcessing;
};
export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("es-BO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getPaymentMethodBadge(method: "efectivo" | "qr") {
  const variants = {
    efectivo: "default",
    qr: "secondary",
  } as const;

  const labels = {
    efectivo: "Efectivo",
    qr: "QR",
  };

  return { variant: variants[method], label: labels[method] };
}

export const getClientInfo = (sale: SaleView) => {
  if (!sale.client) {
    return {
      name: "Sin cliente",
      email: "-",
      phone: "-",
    };
  }

  const client = sale.clientView;
  return {
    name: client?.name || "Sin cliente",
    email: client?.email || "-",
    phone: client?.phone || "-",
  };
};

export const getNitInfo = (sale: SaleView) => {
  return {
    nit: sale.nitClient || "-",
    socialReason: sale.socialReasonClient || "-",
    invoiceNumber: sale.numberInvoice || "-",
  };
};

export const generateSaleData = (
  saleState: SaleState,
  userId: string,
  invoiceNumber: string,
  isDraft = false,
  exchangeRateArg?: number
): CreateSaleData => {
  const totalInBs =
    saleState.paymentCurrency === "arg" && exchangeRateArg
      ? saleState.total / exchangeRateArg
      : saleState.total;

  const totalWithoutDiscountInBs =
    saleState.paymentCurrency === "arg" && exchangeRateArg && saleState.subtotal
      ? saleState.subtotal / exchangeRateArg
      : saleState.subtotal;

  const totalDiscountInBs =
    saleState.paymentCurrency === "arg" &&
    exchangeRateArg &&
    saleState.totalDiscount
      ? saleState.totalDiscount / exchangeRateArg
      : saleState.totalDiscount;

  const saleData: CreateSaleData = {
    items: saleState.items.map((item) => ({
      purchaseBoxId: item.purchaseBoxId,
      product: item.product,
      quantity: item.quantity,
      unitPrice:
        saleState.paymentCurrency === "arg" && exchangeRateArg
          ? item.unitPrice / exchangeRateArg
          : item.unitPrice,
      discount: item.discount,
      total:
        saleState.paymentCurrency === "arg" && exchangeRateArg
          ? item.total / exchangeRateArg
          : item.total,
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
    exchangeRateArg: exchangeRateArg,
    numberInvoice: invoiceNumber,
    createdBy: userId,
    isDraft,
  };
  return saleData;
};

export const recreateSaleStateItems = async (
  saleView: SaleView,
  currency: Currency
): Promise<CartSaleItem[]> => {
  const items: CartSaleItem[] = await Promise.all(
    saleView.items.map(async (item) => ({
      purchaseBoxId: item.purchaseBoxId,
      product: item.product,
      productName: item.productName ?? "",
      productCode: item.productCode,
      purchaseDate: item.purchaseDate ?? "",
      receiptNumber: item.receiptNumber,
      quantity: item.quantity,
      unitPrice: saleView.paymentCurrency === "arg" ? item.unitPrice * (currency.equivalenceToBs || 1) : item.unitPrice,
      discount: 0,
      total: saleView.paymentCurrency === "arg" ? item.total * (currency.equivalenceToBs || 1) : item.total,
      availableStock: await purchaseService
        .findById(item.purchaseBoxId)
        .then((pb) => pb?.quantityAvailable || 0),
      unitCost: 0,
      profitMarginPercentage: 0,
      originalPrice: item.unitPrice,
    }))
  );
  return items;
};
