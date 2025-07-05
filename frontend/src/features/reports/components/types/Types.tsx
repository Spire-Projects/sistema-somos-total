export interface TopProductItem {
  medicationId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface DailySales {
  date: string;
  total: number;
  count: number;
}

export interface PaymentMethodSummary {
  method: string;
  total: number;
  count: number;
  percentage: number;
}