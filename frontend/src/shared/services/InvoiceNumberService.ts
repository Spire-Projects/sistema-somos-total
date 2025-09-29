import { getNumberInvoiceRangeRepository } from "../db/repositories/numberInvoiceRange.repository";
import type { NumberInvoiceRangeDocument } from "../db/models/numberInvoiceRange.model";
import { NumberInvoiceStatus } from "../types/NumberInvoice";
import {
  findSaleById,
  findSalesByDateRangePaginated,
  updateSaleNumberInvoice,
} from "./SalesService";
import { get } from "http";

export class InvoiceNumberService {
  private static readonly RANGE_SIZE = 10; // Tamaño por defecto de cada rango
  private static readonly EXPIRATION_TIME = 15 * 60 * 1000; // 15 minutos en milliseconds
  private static readonly TEMP_NUMBER_PREFIX = "TEMP-";
  private static tempCounter = 0; // Contador para números temporales

  private static repository = getNumberInvoiceRangeRepository();

  /**
   * Obtiene el ID único de la terminal actual
   */
  private static getTerminalId(): string {
    let terminalId = localStorage.getItem("terminal_id");
    if (!terminalId) {
      // Genera un UUID único para cada navegador/pestaña
      terminalId = `PC-${crypto.randomUUID()}`;
      localStorage.setItem("terminal_id", terminalId);
    }
    console.log(`🖥️ Terminal ID: ${terminalId}`);
    return terminalId;
  }

  /**
   * Función principal: obtiene el siguiente número de factura
   * Es rápida porque usa rangos pre-reservados localmente
   */
  static async getNextInvoiceNumber(): Promise<string> {
    try {
      
      // 1. Limpiar rangos expirados (proceso en segundo plano)
      this.cleanupExpiredRanges();

      const terminalId = this.getTerminalId();

      // 2. Buscar rangos activos para esta terminal
      let activeRanges = await this.repository.findActiveRangesByTerminal(
        terminalId
      );

      
      if (activeRanges.length === 0) {
        
        if (navigator.onLine) {
   
          activeRanges = await this.createNewRange(terminalId);
        } else {
          // Offline: usar números temporales
          return this.generateTemporaryNumber(terminalId);
        }
      }

      // 4. Usar el primer rango activo disponible
      const currentRange = activeRanges[0];

      const nextNumber = await this.getNextNumberFromRange(currentRange);

      if (nextNumber) {
        console.log(
          `✅ Número asignado: ${nextNumber} (rango ${currentRange.range[0]}-${currentRange.range[1]})`
        );
        return nextNumber;
      }

      // 5. Si no se pudo obtener número del rango, generar temporal
      console.log("⚠️ No se pudo obtener número del rango, usando temporal");
      return this.generateTemporaryNumber(terminalId);
    } catch (error) {
      console.error("❌ Error obteniendo número de factura:", error);

      // Fallback: generar número temporal
      const terminalId = this.getTerminalId();
      return this.generateTemporaryNumber(terminalId);
    }
  }

  /**
   * Crea un nuevo rango de números para la terminal
   */
  private static async createNewRange(
    terminalId: string
  ): Promise<NumberInvoiceRangeDocument[]> {
    try {
      
      const recyclableNumbers = await this.repository.findRecyclableNumbers();

      let startNumber = 0;
      let endNumber = 0;
      let rangeFound = false;

      for (const recyclable of recyclableNumbers) {
        let rangeExist = await this.repository.findRangeByStartAndEnd(
          startNumber,
          endNumber
        );
        if (navigator.onLine && !rangeExist) {
          const response = await this.verifyRangeByCloud(
            startNumber,
            endNumber
          );
          if (response.exist && response.range) {
            rangeExist = response.range;
          }
        }
       
        if (!rangeExist) {
          rangeFound = true;
          const sourceRangeOriginal = await this.repository.findById(
            recyclable.sourceRangeId
          );
          await this.repository.updateRange(recyclable.sourceRangeId, {
            active: false,
            range: [
              sourceRangeOriginal?.range[0] ?? 0,
              recyclable.startNumber - 1,
            ],
            size: sourceRangeOriginal?.numbersUsed.length ?? 0,
            status: NumberInvoiceStatus.COMPLETED,
          });
          console.log("terminal:: reciclando...:", startNumber, endNumber);

          break;
        }
      }

      let from = 0;
      let verifyRange = { exist: true, range: null as NumberInvoiceRangeDocument | null };
      if (!rangeFound) {
        do {
        startNumber = await this.repository.getNextAvailableNumberForNewRange();
        
        endNumber = this.getNextEndNumber(Math.max(startNumber, from));

         verifyRange = await this.fullVerifyRange(startNumber, endNumber);
        if (verifyRange.exist) {
          from = verifyRange.range ? verifyRange?.range.range[1] + 1 : 0;
        }
        } while (verifyRange.exist);
        
      }

      // 2. Crear el documento del rango
      const now = new Date();
      const rangeData: Omit<NumberInvoiceRangeDocument, "id"> = {
        range: [startNumber, endNumber],
        size: endNumber - startNumber + 1,
        expiredAt: now.getTime() + this.EXPIRATION_TIME,
        terminalId,
        used: 0,
        numbersUsed: [],
        active: true,
        status: NumberInvoiceStatus.ACTIVE,
        createdAt: now.toISOString(),
        recycled: recyclableNumbers.length > 0,
        priority: 0, // Mayor prioridad para rangos nuevos
        sincronized: false,
      };

      const newRange = await this.repository.create(rangeData);
      console.log(
        `✅ Rango creado: ${newRange.id} (${startNumber}-${endNumber}) para ${terminalId}`
      );

      return [newRange];
    } catch (error) {
      console.error("❌ Error creando nuevo rango:", error);
      return [];
    }
  }

  private static getNextEndNumber(startNumber: number): number {
  return Math.ceil(startNumber / 10) * 10;
}
  /**
   * Obtiene el siguiente número disponible del rango
   */
  private static async getNextNumberFromRange(
    range: NumberInvoiceRangeDocument
  ): Promise<string | null> {
    try {
      const [startRange, endRange] = range.range;
      const numbersUsedSet = new Set(range.numbersUsed);

      // Buscar el siguiente número no usado en el rango
      let nextNumber: number | null = null;

      for (let num = startRange; num <= endRange; num++) {
        if (!numbersUsedSet.has(num)) {
          nextNumber = num;
          break;
        }
      }

      if (nextNumber === null) {
        console.log(`⚠️ Rango ${range.id} completamente usado`);
        // Marcar rango como completado
        await this.repository.updateRange(range.id, {
          active: false,
          status: NumberInvoiceStatus.COMPLETED,
        });
        return null;
      }

      // Marcar el número como usado
      await this.repository.markRangeAsUsed(range.id, nextNumber);

      // Formatear número con padding de ceros
      return this.formatInvoiceNumber(nextNumber);
    } catch (error) {
      console.error("❌ Error obteniendo número del rango:", error);
      return null;
    }
  }

  /**
   * Genera un número temporal único cuando no hay conexión
   */
  private static generateTemporaryNumber(terminalId: string): string {
    this.tempCounter++;
    const timestamp = Date.now().toString(36); // Base36 para acortar
    const counter = this.tempCounter.toString().padStart(3, "0");

    const tempNumber = `${this.TEMP_NUMBER_PREFIX}${terminalId}-${timestamp}-${counter}`;
    console.log(`🔄 Número temporal generado: ${tempNumber}`);

    return tempNumber;
  }

  /**
   * Formatea un número de factura con ceros a la izquierda
   */
  private static formatInvoiceNumber(number: number): string {
    return number.toString().padStart(7, "0"); // Formato: 0000001
  }

  /**
   * Limpia rangos expirados en segundo plano (no bloquea)
   */
  private static async cleanupExpiredRanges(): Promise<void> {
    try {
      // Ejecutar en background sin await para no bloquear
      setTimeout(async () => {
        const expiredCount = await this.repository.expireOldRanges();
        if (expiredCount > 0) {
          console.log(`🧹 ${expiredCount} rangos expirados limpiados`);
        }
      }, 0);
    } catch (error) {
      console.error("❌ Error limpiando rangos expirados:", error);
    }
  }

  public static async getTemporaryNumberCount(): Promise<number> {
    try {
        const page = 1;
      const size = 100;
      const dateFrom = new Date(Date.UTC(2025, 7, 1, 0, 0, 0, 0)).toISOString();
      const now = new Date();
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);
      const dateTo = endOfToday.toISOString();
      const idTerminal = this.getTerminalId();
      const searchQuery = this.TEMP_NUMBER_PREFIX + idTerminal;
      console.log("Buscando temps para:", searchQuery);
      const sales = await findSalesByDateRangePaginated(
        page,
        size,
        dateFrom,
        dateTo,
        searchQuery
      );
      return sales.totalItems;
    } catch (error) {

      console.error("❌ Error obteniendo conteo de números temporales:", error);
      return 0;
    }
  }

  /**
   * Resuelve números temporales cuando se restablece la conexión
   */
  static async resolveTemporaryNumbers(): Promise<boolean> {
    try {
      if (!navigator.onLine) {
        console.log(
          "⚠️ Sin conexión, no se pueden resolver números temporales"
        );
        return false;
      }

      const page = 1;
      const size = 100;
      const dateFrom = new Date(Date.UTC(2025, 7, 1, 0, 0, 0, 0)).toISOString();
      const now = new Date();
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);
      const dateTo = endOfToday.toISOString();
      const idTerminal = this.getTerminalId();
      const searchQuery = this.TEMP_NUMBER_PREFIX + idTerminal;
      console.log("Buscando temps para:", searchQuery);
      const sales = await findSalesByDateRangePaginated(
        page,
        size,
        dateFrom,
        dateTo,
        searchQuery
      );
    

      for (const sale of sales.items) {
        try {
         
          const current = await findSaleById(sale.id);
          if (!current) continue;

        
          if (
            !current.numberInvoice ||
            !current.numberInvoice.startsWith(this.TEMP_NUMBER_PREFIX)
          ) {
            continue;
          }

          const newInvoiceNumber = await this.getNextInvoiceNumber();
          if (newInvoiceNumber) {
            await updateSaleNumberInvoice(sale.id, newInvoiceNumber);
          }
        } catch (err) {
          console.error(`❌ Error resolviendo venta ${sale.id}:`, err);
          
        }
      }

      if (sales.totalItems > 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("❌ Error resolviendo números temporales:", error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas de rangos para debugging
   */
  static async getStats(): Promise<{
    totalRanges: number;
    activeRanges: number;
    expiredRanges: number;
    completedRanges: number;
    recyclableNumbers: number;
    terminalRanges: { [terminalId: string]: number };
  }> {
    try {
      const allRanges = await this.repository.findAll();
      const expiredRanges = await this.repository.findExpiredRanges();
      const recyclableNumbers = await this.repository.findRecyclableNumbers();

      const stats = {
        totalRanges: allRanges.length,
        activeRanges: allRanges.filter(
          (r) => r.active && r.status === NumberInvoiceStatus.ACTIVE
        ).length,
        expiredRanges: expiredRanges.length,
        completedRanges: allRanges.filter(
          (r) => r.status === NumberInvoiceStatus.COMPLETED
        ).length,
        recyclableNumbers: recyclableNumbers.reduce(
          (total, range) => total + (range.endNumber - range.startNumber + 1),
          0
        ),
        terminalRanges: allRanges.reduce((acc, range) => {
          acc[range.terminalId] = (acc[range.terminalId] || 0) + 1;
          return acc;
        }, {} as { [terminalId: string]: number }),
      };

      return stats;
    } catch (error) {
      console.error("❌ Error obteniendo estadísticas:", error);
      return {
        totalRanges: 0,
        activeRanges: 0,
        expiredRanges: 0,
        completedRanges: 0,
        recyclableNumbers: 0,
        terminalRanges: {},
      };
    }
  }

  /**
   * Inicializar el servicio (llamar al inicio de la app)
   */
  static async initialize(): Promise<void> {
    try {
      console.log("🚀 Inicializando InvoiceNumberService...");

      const terminalId = this.getTerminalId();
      console.log(`🖥️ Terminal ID: ${terminalId}`);

      // Limpiar rangos expirados al iniciar
      await this.cleanupExpiredRanges();

      console.log("✅ InvoiceNumberService inicializado");
    } catch (error) {
      console.error("❌ Error inicializando InvoiceNumberService:", error);
    }
  }


  static async fullVerifyRange(start: number, end: number): Promise<{ exist: boolean; range: NumberInvoiceRangeDocument | null }> {
    try {
      let rangeExist = await this.repository.findRangeByStartAndEnd(start, end);
      if (navigator.onLine && !rangeExist) {
        const response = await this.verifyRangeByCloud(start, end);
        if (response.exist && response.range) {
          rangeExist = response.range;
        }
      }
      if (rangeExist) {
        return { exist: true, range: rangeExist };
      } else {
        return { exist: false, range: null};
      }
    } catch (error) {
      console.error("❌ Error verificando rango completo:", error);
      return { exist: false, range: null };
    }
  }

  static async verifyRangeByCloud(start: number, end: number): Promise<{ exist: boolean; range?: NumberInvoiceRangeDocument }> {
    try {
    

      const { firestore } = await import("@/shared/config/firebase");
      const { collection, query, where, getDocs, limit } = await import(
        "firebase/firestore"
      );

      const col = collection(firestore, "number_invoice_ranges");
      // Consulta que compara exactamente el array [start, end]
      const q = query(col, where("range", "==", [start, end]), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return { exist: false };

      const doc = snap.docs[0];
      const data = doc.data() as Record<string, any>;
      const rangeDoc = { ...data, id: doc.id } as NumberInvoiceRangeDocument;
      return { exist: true, range: rangeDoc };
    } catch (error) {
      console.error("❌ Error verificando rango en la nube:", error);
      return { exist: false };
    }

  }

  /**
   * Limpiar recursos (llamar al cerrar la app)
   */
  static async destroy(): Promise<void> {
    try {
      console.log("🛑 Finalizando InvoiceNumberService...");
      // Aquí podrían ir tareas de limpieza si las hubiera
      console.log("✅ InvoiceNumberService finalizado");
    } catch (error) {
      console.error("❌ Error finalizando InvoiceNumberService:", error);
    }
  }


}
