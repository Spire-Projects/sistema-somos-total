import { BaseService } from './BaseService';
import type { Sale, SaleView, CreateSaleData, UpdateSaleData, SaleFilter } from '../types/modelTypes/Sale';
import { getSalesRepository } from '../db/repositories/sales.repository';

class SalesService extends BaseService<Sale, SaleView, CreateSaleData, UpdateSaleData, SaleFilter> {
  constructor() {
    super(getSalesRepository());
  }

  protected async toView(entity: Sale): Promise<SaleView> {
    let clientName: string | undefined = undefined;
    
    // Resolver nombre del cliente si existe el ID
    if (entity.client) {
      try {
        // Importación dinámica para evitar dependencias circulares
        const { getClientById } = await import('./ClientService');
        const client = await getClientById(entity.client);
        clientName = client?.name;
      } catch (error) {
        console.error('Error resolving client name:', error);
      }
    }
    
    return {
      ...entity,
      clientName,
    };
  }
}

export const salesService = new SalesService();
