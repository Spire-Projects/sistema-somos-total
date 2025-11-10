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
import { getClientById } from "./ClientService";

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
    let clientName = "";
    if (entity.client) {
      const client = await getClientById(entity.client);
      clientName = client?.name || "";
    }
    // Consultar los productos
    const products = await Promise.all(
      productIds.map((id) => productService.findById(id))
    );
    const productMap: Record<string, { name: string; code?: string }> = {};
    products.forEach((prod, idx) => {
      if (prod)
        productMap[productIds[idx]] = { name: prod.name, code: prod.code };
    });


    const items: SaleItemView[] = entity.items.map((item) => ({
      ...item,
      productName: productMap[item.product]?.name || item.product,
      productCode: productMap[item.product]?.code || "",
      purchaseDate: "", // Completa si tienes la info
      receiptNumber: "", // Completa si tienes la info
    }));

    return {
      ...entity,
      items,
      clientName: clientName, // O busca el nombre si tienes un servicio de clientes
    };
  }
}

export const salesService = new SalesService();
