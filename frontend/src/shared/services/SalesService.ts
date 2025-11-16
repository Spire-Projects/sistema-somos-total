import { BaseService } from "./BaseService";
import type {
  Sale,
  SaleView,
  CreateSaleData,
  UpdateSaleData,
  SaleFilter,
  SaleItemView,
} from "../types/modelTypes/Sale";
import { getSalesRepository } from "../db/repositories/sales.repository";
import { productService } from "./ProductService";
import { getPurchaseBoxRepository } from "../db/repositories/purchase.repository";
import { getUserRepository } from "../db/repositories/user.repository";
import { getClientRepository } from "../db/repositories/client.repository";

class SalesService extends BaseService<
  Sale,
  SaleView,
  CreateSaleData,
  UpdateSaleData,
  SaleFilter
> {
  constructor() {
    super(getSalesRepository());
  }

  protected async toView(entity: Sale): Promise<SaleView> {
    const productIds = Array.from(
      new Set(entity.items.map((item) => item.product))
    );
    
    // Consultar los productos
    const products = await Promise.all(
      productIds.map((id) => productService.findById(id))
    );
    const productMap: Record<string, { name: string; code?: string }> = {};
    products.forEach((prod, idx) => {
      if (prod)
        productMap[productIds[idx]] = { name: prod.name, code: prod.code };
    });

    // Obtener purchaseBox info
    const purchaseRepository = getPurchaseBoxRepository();
    const purchaseBoxIds = Array.from(
      new Set(entity.items.map((item) => item.purchaseBoxId))
    );
    const purchaseBoxes = await Promise.all(
      purchaseBoxIds.map((id) => purchaseRepository.findById(id))
    );
    const purchaseBoxMap: Record<string, { purchaseDate?: string; receiptNumber?: string }> = {};
    purchaseBoxes.forEach((box, idx) => {
      if (box)
        purchaseBoxMap[purchaseBoxIds[idx]] = {
          purchaseDate: box.purchaseDate,
          receiptNumber: box.receiptNumber,
        };
    });

    const items: SaleItemView[] = entity.items.map((item) => ({
      ...item,
      productName: productMap[item.product]?.name || item.product,
      productCode: productMap[item.product]?.code || "",
      purchaseDate: purchaseBoxMap[item.purchaseBoxId]?.purchaseDate || "",
      receiptNumber: purchaseBoxMap[item.purchaseBoxId]?.receiptNumber || "",
    }));

    const clientRep = getClientRepository();
    const clientView = await clientRep.findById(entity.client || "");
    return {
      ...entity,
      items,
      clientView: clientView || null,
    };
  }
}

export const salesService = new SalesService();
