import type { ItemsResponse } from '../../../types/UtilTypes';
import { Observable } from 'rxjs';
/**
 * Interfaz abstracta base para todas las operaciones CRUD
 * Define el contrato mínimo que todo repositorio debe cumplir
 * 
 * @template T - Tipo de entidad que maneja el repositorio
 * @template TCreate - Tipo de datos para creación
 * @template TUpdate - Tipo de datos para actualización
 */
export interface ICrudBaseRepository<T, TCreate, TUpdate, TFilter> {
    create(data: TCreate): Promise<T>;
    update(id: string, updateData: TUpdate): Promise<T | null>;
    softDelete(id: string): Promise<boolean>;
    getAll(page: number, size: number, searchQuery?: string, dateFrom?: string, dateTo?: string, filter?: TFilter): Promise<ItemsResponse<T>>;
    findById(id: string): Promise<T | null>;
    listen$(page: number, size: number, searchQuery?: string, dateFrom?: string, dateTo?: string, filter?: TFilter): Observable<T[]>;
    lisntenById$(id: string): Observable<T | null>;
}
