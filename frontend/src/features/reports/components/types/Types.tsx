export interface TopProductItem {
  productId: string;
  name: string;
  code?: string;
  quantity: number;
  revenueBs: number;
  revenueArg: number;
}

export interface DailySales {
  date: string;
  totalBs: number;
  totalArg: number;
  count: number;
}

export interface PaymentMethodSummary {
  method: string;
  totalBs: number;
  totalArg: number;
  count: number;
  percentage: number;
}

export interface SalesSummary {
  totalBs: number;
  totalArg: number;
  count: number;
  averageBs: number;
  averageArg: number;
}
