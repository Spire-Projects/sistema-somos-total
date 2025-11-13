import type { IEntity } from "../UtilTypes";

export interface Currency extends IEntity {
    simbol: string;          // Símbolo de la moneda (por ejemplo, $, €, etc.)
    equivalenceToBs: number; // Equivalencia de la moneda respecto al boliviano (Bs)
}

export interface CreateCurrencyData {
    simbol: string;
    equivalenceToBs: number;
    createdBy: string;
}

export interface UpdateCurrencyData {
    simbol?: string;
    equivalenceToBs?: number;
    updatedBy?: string;
}

export interface CurrencyFilter {
    simbol?: string;
}

