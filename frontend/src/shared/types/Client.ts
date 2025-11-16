import type { IEntity } from "./UtilTypes";

export interface Client extends IEntity {
   
    name: string; // e.g., "John Doe"
    email?: string; // e.g. hola@test.co
    phone?: string; // e.g. "+1-234-567-8901"
    address?: string; // e.g. "123 Main St, Anytown, USA"
}

export interface CreateClientData {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    createdBy: string;
}

export interface UpdateClientData {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    updatedBy: string;
}

export interface ClientFilter {
    dateFrom?: string; // ISO date string
    dateTo?: string;   // ISO date strings
}