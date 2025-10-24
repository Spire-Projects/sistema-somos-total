import { BaseService } from './BaseService';
import type { PurchaseBox, PurchaseView, CreatePurchaseData, UpdatePurchaseData, PurchaseFilter } from '../types/modelTypes/PurchaseBox';
import { getPurchaseBoxRepository } from '../db/repositories/purchase.repository';
import { getProductRepository } from '../db/repositories/product.repository';

class PurchaseService extends BaseService<PurchaseBox, PurchaseView, CreatePurchaseData, UpdatePurchaseData, PurchaseFilter> {
  constructor() {
    super(getPurchaseBoxRepository());
  }

  protected async toView(entity: PurchaseBox): Promise<PurchaseView> {
    let productCode: string | undefined = undefined;
    let productName: string | undefined = undefined;
    let productCategory: string | undefined = undefined;
    let supplierName: string | undefined = undefined;
    
    // Resolver información del producto si existe el ID
    if (entity.productId) {
      try {
        const productRepo = getProductRepository();
        const product = await productRepo.findById(entity.productId);
        
        if (product) {
          productCode = product.code;
          productName = product.name;
          productCategory = product.category;
        }
      } catch (error) {
        console.error('Error resolving product info:', error);
      }
    }

    if (entity.supplierId) {
        try {
            // Importación dinámica para evitar dependencias circulares
            const manufacturerService = await import('./ManufacturerService');
            const supplier = await manufacturerService.manufacturerService.findById(entity.supplierId);
            if (supplier) {
                supplierName = supplier.name;
            }
        } catch (error) {
            console.error('Error resolving supplier info:', error);
        }
    }
    
    return {
      ...entity,
      product: {} as any, // TODO: Resolver el producto completo si es necesario
      productCode,
      productName,
      productCategory,
      supplierName
    };
  }
}

export const purchaseService = new PurchaseService();
