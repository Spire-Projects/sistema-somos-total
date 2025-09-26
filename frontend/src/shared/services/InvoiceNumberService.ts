import { getNumberInvoiceRangeRepository } from "../db/repositories/numberInvoiceRange.repository";
import type { NumberInvoiceRangeDocument } from "../db/models/numberInvoiceRange.model";
import { NumberInvoiceStatus } from "../types/NumberInvoice";
import {
  findSaleById,
  findSalesByDateRangePaginated,
  updateSaleNumberInvoice,
} from "./SalesService";

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
      console.log("🎯 Obteniendo siguiente número de factura...");
      console.log("terminal:: getting next number for terminal:");

      // 1. Limpiar rangos expirados (proceso en segundo plano)
      this.cleanupExpiredRanges();

      const terminalId = this.getTerminalId();

      // 2. Buscar rangos activos para esta terminal
      let activeRanges = await this.repository.findActiveRangesByTerminal(
        terminalId
      );

      // 3. Si no hay rangos activos, intentar crear uno nuevo
      if (activeRanges.length === 0) {
        console.log(
          `📋 No hay rangos activos para ${terminalId}, creando nuevo...`
        );

        if (navigator.onLine) {
          // Conectado: crear nuevo rango oficial
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
      // 1. Buscar números reciclables primero
      console.log("terminal:: creating new range for:", terminalId);
      const recyclableNumbers = await this.repository.findRecyclableNumbers();

      let startNumber = 0;
      let endNumber = 0;
      let rangeFound = false;

      for (const recyclable of recyclableNumbers) {
        if (rangeFound) break;
        startNumber = recyclable.startNumber;
        endNumber = Math.min(
          recyclable.endNumber,
          startNumber + this.RANGE_SIZE - 1
        );
        const verifyRange = await this.repository.findRangeByStartAndEnd(
          startNumber,
          endNumber
        );
        if (!verifyRange) {
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

      if (!rangeFound) {
        startNumber = await this.repository.getNextAvailableNumberForNewRange();
        endNumber = startNumber + this.RANGE_SIZE - 1;
        console.log(`🆕 Creando nuevo rango ${startNumber}-${endNumber}`);
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
      console.log(
        `🔍 ${sales.totalItems} ventas temporales encontradas para resolver`
      );

      for (const sale of sales.items) {
        try {
          // Re-check the current sale state to avoid updating an already-resolved invoice
          const current = await findSaleById(sale.id);
          if (!current) continue;

          // Si ya no es temporal, saltar
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
          // Continuar con la siguiente venta
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
