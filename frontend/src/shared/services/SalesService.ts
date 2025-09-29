import type { Sale } from "../types/Sales";
import type { ItemsResponse } from "../types/UtilTypes";
import { getSaleRepository } from "../db/repositories/sale.repository";
import { addSaleToClientHistory, getClientById } from "./ClientService";
import { UserService } from "./UserService";
import { generateId } from "../utils/id.utils";
import { getCachedValue, setCachedValue } from "../utils/entity-cache.utils";

const repository = getSaleRepository();

/**
 * Helper: Obtener nombre de cliente con cache
 */
const getClientName = async (clientId: string): Promise<string> => {
  const cacheKey = `client_name_${clientId}`;

  // Intentar obtener del cache
  const cachedName = getCachedValue<string>(cacheKey);
  if (cachedName !== null) {
    return cachedName;
  }

  // Si no está en cache, buscar en la base de datos
  const client = await getClientById(clientId);
  const name = client?.name || "Cliente no encontrado";

  // Guardar en cache
  setCachedValue(cacheKey, name);
  return name;
};

/**
 * Helper: Obtener nombre de vendedor con cache
 */
const getSellerName = async (userId: string): Promise<string> => {
  const cacheKey = `seller_name_${userId}`;

  // Intentar obtener del cache
  const cachedName = getCachedValue<string>(cacheKey);
  if (cachedName !== null) {
    return cachedName;
  }

  // Si no está en cache, buscar en la base de datos
  const result = await UserService.getUserById(userId);
  const name = result.user?.fullName || "Vendedor no encontrado";

  // Guardar en cache
  setCachedValue(cacheKey, name);
  return name;
};

/**
 * Limpiar datos de venta para evitar valores undefined que causan problemas en Firestore
 */
export const cleanSaleData = (data: any): Sale => {
  console.log("Cleaning sale data:", data);
  return {
    ...data,
    client: data.client || "",
    idMedic: data.idMedic || "",
    nitClient: data.nitClient || "",
    socialReasonClient: data.socialReasonClient || "",
    saleNotes: data.saleNotes || "",
    totalWithoutDiscount: data.totalWithoutDiscount || 0,
    totalDiscount: data.totalDiscount || 0,
  };
};

/**
 * Generar el siguiente número de factura secuencial usando el nuevo sistema de rangos
 */
const getNextInvoiceNumber = async (): Promise<string> => {
  try {
    // Importación dinámica para evitar problemas de dependencias circulares
    const { InvoiceNumberService } = await import("./InvoiceNumberService");

    const invoiceNumber = await InvoiceNumberService.getNextInvoiceNumber();
    console.log(`📄 Número de factura generado: ${invoiceNumber}`);

    return invoiceNumber;
  } catch (error) {
    console.error("❌ Error al generar número de factura:", error);

    // Fallback: usar el sistema anterior como último recurso
    try {
      const highestNumber = await repository.getHighestInvoiceNumber();
      const nextNumber = highestNumber + 1;
      const formattedNumber = nextNumber.toString().padStart(7, "0");
      console.log(`📄 Fallback: usando número ${formattedNumber}`);
      return formattedNumber;
    } catch (fallbackError) {
      console.error("❌ Error en fallback:", fallbackError);
      return "0000001";
    }
  }
};

/**
 * Crear una venta
 */
export const createSale = async (
  data: Omit<Sale, "id" | "createdAt">
): Promise<Sale> => {
  const cleanedData = cleanSaleData(data);
  let nextInvoiceNumber;
  let exist = [] as Sale[];

  do {
    nextInvoiceNumber = await getNextInvoiceNumber();
    exist = await repository.search(nextInvoiceNumber);
  } while (exist.length > 0);

  const newSale: Sale = {
    id: generateId(),
    items: cleanedData.items,
    total: cleanedData.total,
    totalWithoutDiscount: cleanedData.totalWithoutDiscount,
    totalDiscount: cleanedData.totalDiscount,
    client: cleanedData.client,
    paymentMethod: cleanedData.paymentMethod,
    createdBy: cleanedData.createdBy,
    createdAt: new Date().toISOString(),
    isDeleted: cleanedData.isDeleted || false,
    sincronized: cleanedData.sincronized || false,
    idMedic: cleanedData.idMedic,
    factured: cleanedData.factured || false,
    nitClient: cleanedData.nitClient,
    socialReasonClient: cleanedData.socialReasonClient,
    saleNotes: cleanedData.saleNotes,
    numberInvoice: nextInvoiceNumber,
  };

  const createdSale = await repository.create(newSale);
  if (createdSale.client && createdSale.client.trim() !== "") {
    try {
      await addSaleToClientHistory(createdSale.client, createdSale.id);
      console.log(
        `✅ Venta ${createdSale.id} agregada al historial del cliente ${createdSale.client}`
      );
    } catch (error) {
      console.error(
        `❌ Error al agregar venta al historial del cliente:`,
        error
      );
      
    }
  }

  return createdSale;
};

/**
 * Buscar venta por ID
 */
export const findSaleById = async (id: string): Promise<Sale | null> => {
  return await repository.findById(id);
};

/**
 * Obtener todas las ventas
 */
export const findAllSales = async (): Promise<Sale[]> => {
  return await repository.findAll();
};

/**
 * Eliminar venta
 */
export const deleteSale = async (id: string): Promise<boolean> => {
  const existing = await repository.findById(id);
  if (!existing) {
    throw new Error(`Sale with ID "${id}" not found`);
  }

  return await repository.delete(id);
};

/**
 * Buscar ventas por cliente o medicamento
 */
export const searchSales = async (query: string): Promise<Sale[]> => {
  return await repository.search(query);
};

/**
 * Obtener ventas paginadas
 */
export interface ExtendedSale extends Sale {
  clientName?: string;
  sellerName?: string;
}

export const findSalesPaginated = async (
  page: number,
  size: number,
  searchQuery?: string
): Promise<ItemsResponse<ExtendedSale>> => {
  // 1. Obtener las ventas base
  const response = await repository.findAllPaginated(page, size, searchQuery);

  // 2. Enriquecer las ventas con nombres resueltos
  const extendedSales = await Promise.all(
    response.items.map(async (sale) => {
      // Resolver nombres en paralelo si existen IDs
      const [clientName, sellerName] = await Promise.all([
        sale.client ? getClientName(sale.client) : Promise.resolve(undefined),
        sale.createdBy
          ? getSellerName(sale.createdBy)
          : Promise.resolve(undefined),
      ]);

      return {
        ...sale,
        clientName,
        sellerName,
      };
    })
  );

  // 3. Si hay término de búsqueda, filtrar también por nombres resueltos
  let filteredSales = extendedSales;
  if (searchQuery && searchQuery.trim()) {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    filteredSales = extendedSales.filter(
      (sale) =>
        sale.clientName?.toLowerCase().includes(normalizedQuery) ||
        sale.sellerName?.toLowerCase().includes(normalizedQuery) ||
        sale.id.toLowerCase().includes(normalizedQuery) ||
        sale.nitClient?.toLowerCase().includes(normalizedQuery) ||
        sale.socialReasonClient?.toLowerCase().includes(normalizedQuery)
    );
  }

  return {
    ...response,
    items: filteredSales,
    // Actualizar total si se filtraron resultados
    totalItems: searchQuery ? filteredSales.length : response.totalItems,
  };
};

/**
 * Obtener ventas por rango de fechas
 */
export const findSalesByDateRange = async (
  dateFrom: string,
  dateTo: string
): Promise<Sale[]> => {
  return await repository.findByDateRange(dateFrom, dateTo);
};

/**
 * Obtener ventas por rango de fechas paginadas
 */
export const findSalesByDateRangePaginated = async (
  page: number,
  size: number,
  dateFrom: string,
  dateTo: string,
  searchQuery?: string
): Promise<ItemsResponse<Sale>> => {
  return await repository.findByDateRangePaginated(
    page,
    size,
    dateFrom,
    dateTo,
    searchQuery
  );
};

/**
 * Obtener ventas por estado de facturación
 */
export const findSalesByFacturedStatus = async (
  factured: boolean
): Promise<Sale[]> => {
  return await repository.findByFacturedStatus(factured);
};

/**
 * Obtener ventas por estado de facturación paginadas
 */
export const findSalesByFacturedStatusPaginated = async (
  page: number,
  size: number,
  factured: boolean,
  searchQuery?: string
): Promise<ItemsResponse<Sale>> => {
  return await repository.findByFacturedStatusPaginated(
    page,
    size,
    factured,
    searchQuery
  );
};

/**
 * Obtener ventas por rango de fechas y estado de facturación
 */
export const findSalesByDateRangeAndFacturedStatus = async (
  dateFrom: string,
  dateTo: string,
  factured: boolean
): Promise<Sale[]> => {
  return await repository.findByDateRangeAndFacturedStatus(
    dateFrom,
    dateTo,
    factured
  );
};

/**
 * Obtener ventas por rango de fechas y estado de facturación paginadas
 */
export const findSalesByDateRangeAndFacturedStatusPaginated = async (
  page: number,
  size: number,
  dateFrom: string,
  dateTo: string,
  factured: boolean,
  searchQuery?: string
): Promise<ItemsResponse<Sale>> => {
  return await repository.findByDateRangeAndFacturedStatusPaginated(
    page,
    size,
    dateFrom,
    dateTo,
    factured,
    searchQuery
  );
};

/**
 * Actualizar estado de facturación de una venta
 */
export const updateSaleFacturedStatus = async (
  id: string,
  factured: boolean
): Promise<Sale> => {
  const currentData = await repository.findById(id);
  if (!currentData) {
    throw new Error(`Sale with ID "${id}" not found`);
  }
  const updateData = { ...currentData, factured };
  return await repository.update(id, updateData);
};

/**
 * Actualizar el número de factura de una venta
 * - Si se pasa un número sólo con dígitos, lo formatea a 7 caracteres con ceros a la izquierda.
 */
export const updateSaleNumberInvoice = async (
  id: string,
  numberInvoice: string
): Promise<Sale> => {
  const currentData = await repository.findById(id);
  if (!currentData) {
    throw new Error(`Sale with ID "${id}" not found`);
  }

  // Normalizar: si es sólo dígitos, formatear a 7 caracteres (0000001)
  let formattedNumber = numberInvoice;
  if (/^\d+$/.test(numberInvoice)) {
    formattedNumber = numberInvoice.padStart(7, "0");
  }

  const updateData = { ...currentData, numberInvoice: formattedNumber };
  return await repository.update(id, updateData);
};

export const generateSaleReport = async (
  idSale: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Importar dinámicamente para evitar dependencias circulares
    const { generateSaleReport: generateReportFromService } = await import(
      "./ReportService"
    );
    return await generateReportFromService(idSale);
  } catch (error) {
    console.error("Error generating sale report:", error);
    return { success: false, error: "Error al generar el reporte" };
  }
};
