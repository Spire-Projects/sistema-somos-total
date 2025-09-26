import type { RxCollection } from 'rxdb';
import { initDatabase } from '../database';
import { BaseRepository } from './BaseRepository';
import type { NumberInvoiceRangeDocument } from '../models/numberInvoiceRange.model';
import { NumberInvoiceStatus } from '../../types/NumberInvoice';

export interface INumberInvoiceRangeRepository {
  create(rangeData: Omit<NumberInvoiceRangeDocument, 'id'>): Promise<NumberInvoiceRangeDocument>;
  findById(id: string): Promise<NumberInvoiceRangeDocument | null>;
  findAll(): Promise<NumberInvoiceRangeDocument[]>;
  findActiveRangesByTerminal(terminalId: string): Promise<NumberInvoiceRangeDocument[]>;
  findExpiredRanges(): Promise<NumberInvoiceRangeDocument[]>;
  findRecyclableNumbers(): Promise<{ startNumber: number; endNumber: number; sourceRangeId: string }[]>;
  updateRange(id: string, updateData: Partial<NumberInvoiceRangeDocument>): Promise<NumberInvoiceRangeDocument | null>;
  markRangeAsUsed(id: string, numberUsed: number): Promise<NumberInvoiceRangeDocument | null>;
  expireOldRanges(): Promise<number>; // Retorna cantidad de rangos expirados
  getNextAvailableNumberForNewRange(): Promise<number>;
  delete(id: string): Promise<boolean>;
  findRangeByStartAndEnd(start: number, end: number): Promise<NumberInvoiceRangeDocument | null>;
}

export class LocalNumberInvoiceRangeRepository 
  extends BaseRepository<NumberInvoiceRangeDocument> 
  implements INumberInvoiceRangeRepository {

  protected async getCollection(): Promise<RxCollection<NumberInvoiceRangeDocument>> {
    const db = await initDatabase();
    return db.number_invoice_ranges;
  }

 

  async create(rangeData: Omit<NumberInvoiceRangeDocument, 'id'>): Promise<NumberInvoiceRangeDocument> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const fullData: NumberInvoiceRangeDocument = {
      id,
      ...rangeData,
      createdAt: rangeData.createdAt || now,
      sincronized: false
    };

    console.log(`🔄 NumberInvoiceRangeRepository: Creando rango ${fullData.range[0]}-${fullData.range[1]} para terminal ${fullData.terminalId}`);
    return await this.createWithPriority(fullData);
  }

  async updateRange(id: string, updateData: Partial<NumberInvoiceRangeDocument>): Promise<NumberInvoiceRangeDocument | null> {
    console.log(`🔄 NumberInvoiceRangeRepository: Actualizando rango ${id}`);
    return await this.updateWithPriority(id, updateData);
  }

  async delete(id: string): Promise<boolean> {
    console.log(`🗑️ NumberInvoiceRangeRepository: Eliminando rango ${id}`);
    return await this.deleteWithPriority(id);
  }

  async findById(id: string): Promise<NumberInvoiceRangeDocument | null> {
    const db = await initDatabase();
    const range = await db.number_invoice_ranges.findOne({ 
      selector: { id } 
    }).exec();
    return range ? range.toJSON() as NumberInvoiceRangeDocument : null;
  }

  async findAll(): Promise<NumberInvoiceRangeDocument[]> {
    const db = await initDatabase();
    const ranges = await db.number_invoice_ranges.find().exec();
    return ranges.map(range => range.toJSON() as NumberInvoiceRangeDocument);
  }

  async findActiveRangesByTerminal(terminalId: string): Promise<NumberInvoiceRangeDocument[]> {
    const db = await initDatabase();
    const now = Date.now();
    
    const ranges = await db.number_invoice_ranges.find({
      selector: {
        terminalId,
        active: true,
        status: NumberInvoiceStatus.ACTIVE,
        expiredAt: { $gt: now } // No expirados
      },
      sort: [{ priority: 'asc' }] // Menor prioridad = mayor preferencia
    }).exec();

    return ranges.map(range => range.toJSON() as NumberInvoiceRangeDocument);
  }

  async findExpiredRanges(): Promise<NumberInvoiceRangeDocument[]> {
    const db = await initDatabase();
    const now = Date.now();

    const ranges = await db.number_invoice_ranges.find({
      selector: {
        active: true,
        expiredAt: { $lt: now } // Ya expirados
      }
    }).exec();

    return ranges.map(range => range.toJSON() as NumberInvoiceRangeDocument);
  }

  async findRecyclableNumbers(): Promise<{ startNumber: number; endNumber: number; sourceRangeId: string }[]> {
    const db = await initDatabase();
    const now = Date.now();

    // Buscar rangos expirados o completados que tienen números no usados
    const ranges = await db.number_invoice_ranges.find({
      selector: {
        $or: [
          { status: NumberInvoiceStatus.EXPIRED },
          { status: NumberInvoiceStatus.ACTIVE, expiredAt: { $lt: now } }
        ]
      }
    }).exec();

    // Filtrar en memoria los que tienen números sin usar (used < size)
    const filteredRanges = ranges.filter(rangeDoc => {
      const range = rangeDoc.toJSON() as NumberInvoiceRangeDocument;
      return range.used < range.size;
    });

  const recyclableNumbers: { startNumber: number; endNumber: number; sourceRangeId: string }[] = [];
    console.log("terminal:: ranges:", ranges);
    console.log("terminal:: filteredRanges:", filteredRanges);

    filteredRanges.forEach(rangeDoc => {
      const range = rangeDoc.toJSON() as NumberInvoiceRangeDocument;
      const [startRange, endRange] = range.range;
      const numbersUsedSet = new Set(range.numbersUsed);
      // Encontrar números no usados en el rango
      for (let num = startRange; num <= endRange; num++) {
        if (!numbersUsedSet.has(num)) {
          // Encontramos un número libre, buscar secuencia continua
          let endSequence = num;
          while (endSequence + 1 <= endRange && !numbersUsedSet.has(endSequence + 1)) {
            endSequence++;
          }
          recyclableNumbers.push({
            startNumber: num,
            endNumber: endSequence,
            sourceRangeId: range.id
          });
          // Saltar la secuencia que ya procesamos
          num = endSequence;
        }
      }
    });

   
    // Ordenar por número de inicio
    return recyclableNumbers.sort((a, b) => a.startNumber - b.startNumber);
  }

  async markRangeAsUsed(id: string, numberUsed: number): Promise<NumberInvoiceRangeDocument | null> {
    const range = await this.findById(id);
    if (!range) return null;

    const updatedNumbersUsed = [...range.numbersUsed, numberUsed];
    const updatedUsed = range.used + 1;
    const now = new Date().toISOString();

    // Verificar si el rango está completo
    const isComplete = updatedUsed >= range.size;
    const newStatus = isComplete ? NumberInvoiceStatus.COMPLETED : range.status;

    return await this.updateRange(id, {
      used: updatedUsed,
      numbersUsed: updatedNumbersUsed,
      lastUsedAt: now,
      status: newStatus,
      active: !isComplete // Si está completo, ya no está activo
    });
  }

  async expireOldRanges(): Promise<number> {
    const expiredRanges = await this.findExpiredRanges();
    let expiredCount = 0;

    for (const range of expiredRanges) {
      const updated = await this.updateRange(range.id, {
        active: false,
        status: NumberInvoiceStatus.EXPIRED
      });

      if (updated) {
        expiredCount++;
        console.log(`⏰ Rango ${range.id} (${range.range[0]}-${range.range[1]}) expirado para terminal ${range.terminalId}`);
      }
    }

    return expiredCount;
  }

  async getNextAvailableNumberForNewRange(): Promise<number> {
    const db = await initDatabase();

    // Encontrar el número más alto usado en cualquier rango
    const allRanges = await db.number_invoice_ranges.find({
      sort: [{ 'range.1': 'desc' }] // Ordenar por el final del rango descendente
    }).limit(1).exec();

    if (allRanges.length === 0) {
      return 1; // Primer número si no hay rangos
    }

    const lastRange = allRanges[0].toJSON() as NumberInvoiceRangeDocument;
    return lastRange.range[1] + 1; // Siguiente número después del último rango
  }

  async findRangeByStartAndEnd(start: number, end: number): Promise<NumberInvoiceRangeDocument | null> {
    const db = await initDatabase();
    const result = await db.number_invoice_ranges.findOne({
      selector: {
        'range.0': { $eq: start },
        'range.1': { $eq: end }
      }
    }).exec();

    return result ? (result.toJSON() as NumberInvoiceRangeDocument) : null;
  }
}

export class FirestoreNumberInvoiceRangeRepository implements INumberInvoiceRangeRepository {
  async create(_rangeData: Omit<NumberInvoiceRangeDocument, 'id'>): Promise<NumberInvoiceRangeDocument> {
    throw new Error('Firestore implementation not yet available');
  }
  async findById(_id: string): Promise<NumberInvoiceRangeDocument | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async findAll(): Promise<NumberInvoiceRangeDocument[]> {
    throw new Error('Firestore implementation not yet available');
  }
  async findActiveRangesByTerminal(_terminalId: string): Promise<NumberInvoiceRangeDocument[]> {
    throw new Error('Firestore implementation not yet available');
  }
  async findExpiredRanges(): Promise<NumberInvoiceRangeDocument[]> {
    throw new Error('Firestore implementation not yet available');
  }
  async findRecyclableNumbers(): Promise<{ startNumber: number; endNumber: number; sourceRangeId: string }[]> {
    throw new Error('Firestore implementation not yet available');
  }
  async updateRange(_id: string, _updateData: Partial<NumberInvoiceRangeDocument>): Promise<NumberInvoiceRangeDocument | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async markRangeAsUsed(_id: string, _numberUsed: number): Promise<NumberInvoiceRangeDocument | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async expireOldRanges(): Promise<number> {
    throw new Error('Firestore implementation not yet available');
  }
  async getNextAvailableNumberForNewRange(): Promise<number> {
    throw new Error('Firestore implementation not yet available');
  }
  async delete(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }
  async findRangeByStartAndEnd(_start: number, _end: number): Promise<NumberInvoiceRangeDocument | null> {
    throw new Error('Firestore implementation not yet available');
  }
}

export const localNumberInvoiceRangeRepository = new LocalNumberInvoiceRangeRepository();
export const firestoreNumberInvoiceRangeRepository = new FirestoreNumberInvoiceRangeRepository();

// Factory function to get the appropriate repository based on config
import { config } from '../../config/config';
export const getNumberInvoiceRangeRepository = (): INumberInvoiceRangeRepository => {
  return config.APP_MODE === 'local' ? localNumberInvoiceRangeRepository : firestoreNumberInvoiceRangeRepository;
};