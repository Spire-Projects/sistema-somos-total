import { BaseService } from './BaseService';
import type { CreateCurrencyData, Currency, CurrencyFilter, UpdateCurrencyData } from '../types/modelTypes/Currency';
import { getCurrencyRepository } from '../db/repositories/currency.repository';


class CurrencyService extends BaseService<Currency, Currency, CreateCurrencyData, UpdateCurrencyData, CurrencyFilter> {
  constructor() {
    super(getCurrencyRepository());
  }

  protected async toView(entity: Currency): Promise<Currency> {
    // No necesitamos transformación adicional para categorías
    return entity;
  }
}

export const currencyService = new CurrencyService();
