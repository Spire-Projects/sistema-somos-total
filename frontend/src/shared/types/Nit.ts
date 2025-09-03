export interface NIT {
  id: string;
  numberNit: string; // e.g. "123456789"
  socialReason: string; // e.g. "Empresa S.A."
  sincronized: boolean; // indicates if the NIT is synchronized with the server
  _deleted: boolean; // indicates if the NIT is deleted (RxDB soft delete field)
  createdBy?: string; // e.g., "user123" - ID of the user who created this NIT
  updatedBy?: string; // e.g., "user123" - ID of the user who last updated this NIT
  deletedBy?: string; // e.g., "user123" - ID of the user who deleted this NIT
  createdAt: string; // e.g., "2023-10-01T12:00:00Z"
  updatedAt: string; // e.g., "2023-10-01T12:00:00Z"
  deletedAt?: string; // e.g., "2023-10-01T12:00:00Z"
}
