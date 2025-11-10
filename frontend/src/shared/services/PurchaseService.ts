import { BaseService } from "./BaseService";
import type {
  PurchaseBox,
  PurchaseView,
  CreatePurchaseData,
  UpdatePurchaseData,
  PurchaseFilter,
} from "../types/modelTypes/PurchaseBox";
import { getPurchaseBoxRepository } from "../db/repositories/purchase.repository";
import type { ProductView } from "../types/modelTypes/Product";
import { manufacturerService } from "./ManufacturerService";

class PurchaseService extends BaseService<
  PurchaseBox,
  PurchaseView,
  CreatePurchaseData,
  UpdatePurchaseData,
  PurchaseFilter
> {
  constructor() {
    super(getPurchaseBoxRepository());
  }

  protected async toView(entity: PurchaseBox): Promise<PurchaseView> {
    let productCode: string | undefined = undefined;
    let productName: string | undefined = undefined;
    let productCategory: string | undefined = undefined;
    let supplierName: string | undefined = undefined;
    let product: ProductView | undefined = undefined;

    // Resolver información del producto si existe el ID
    // Usar el repositorio directamente para evitar ciclo infinito
    if (entity.productId) {
      try {
        const { getProductRepository } = await import(
          "../db/repositories/product.repository"
        );
        const productRepo = getProductRepository();
        const productEntity = await productRepo.findById(entity.productId);

        if (productEntity) {
          productCode = productEntity.code;
          productName = productEntity.name;
          productCategory = productEntity.category;

          // Crear ProductView básico sin el stock (para evitar ciclo)
          let categoryName: string | undefined = undefined;
          if (productEntity.category) {
            try {
              const { categoryService } = await import("./CategoryService");
              const category = await categoryService.findById(
                productEntity.category
              );
              categoryName = category?.name;
            } catch (error) {
              console.error("Error resolving category:", error);
            }
          }

          product = {
            ...productEntity,
            categoryName,
            stock: 0, // No calcular stock aquí para evitar ciclo infinito
          };
        }
      } catch (error) {
        console.error("Error resolving product info:", error);
      }
    }

    if (entity.supplierId) {
      try {
        const supplier = await manufacturerService.findById(entity.supplierId);
        if (supplier) {
          supplierName = supplier.name;
        }
      } catch (error) {
        console.error("Error resolving supplier info:", error);
      }
    }

    return {
      ...entity,
      product: product || ({} as ProductView),
      productCode,
      productName,
      productCategory,
      supplierName,
    };
  }
}

export const purchaseService = new PurchaseService();
