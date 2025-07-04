export interface Client {
    id: string; // unique identifier for the client
    name: string; // e.g., "John Doe"
    email?: string; // e.g. hola@test.com
    nit?: string; // e.g. "123456789"
    phone?: string; // e.g. "+1-234-567-8901"
    address?: string; // e.g. "123 Main St, Anytown, USA"
    sincronized: boolean; // indicates if the medication is synchronized with the server
    isDeleted: boolean; // indicates if the client is deleted
    salesHistory?: string[]; // e.g., ["sale1", "sale2"] - IDs of sales made by this client
    loyaltyPoints?: number; // e.g., 100
    lastPurchaseDate?: string; // e.g., "2023-10-01T12:00:00Z"
    createdBy?: string; // e.g., "user123" - ID of the user
    updatedBy?: string; // e.g., "user123" - ID of the user who last updated this client
    createdAt: string; // e.g., "2023-10-01T12:00:00Z"
    updatedAt: string; // e.g., "2023-10-01T12:00:00Z"
}