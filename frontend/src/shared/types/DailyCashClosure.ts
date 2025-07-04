export interface DailyCashClosure {
  id: string;
  userId: string;
  date: string;
  openingAmount: number;
  closingAmount: number;
  notes?: string;

  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  sincronized?: boolean;
  isDeleted?: boolean;
  deletedBy?: string;
}

export type Denomination = {
  label: string;
  value: number;
};

export type CashBreakdown = {
  denomination: Denomination;
  quantity: number;
};
