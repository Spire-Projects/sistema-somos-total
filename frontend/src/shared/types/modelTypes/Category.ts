import type { IEntity } from "../UtilTypes";

export interface Category extends IEntity {
    name: string;            // Nombre de la categoría
    description?: string;   // Descripción de la categoría
}

export interface CreateCategoryData {
    name: string;
    description?: string;
    createdBy: string;
}

export interface UpdateCategoryData {
    name?: string;
    description?: string;
    updatedBy?: string;
}
