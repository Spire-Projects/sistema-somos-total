import { getDailyCashClosureRepository } from "../db/repositories/dailyCashClosure.repository";
import type { CreateDaylyCashClosure, DailyCashClosure, DailyCashClosureFilter, UpdateDailyCashClosure } from "../types/DailyCashClosure";
import { BaseService } from "./BaseService";

class DailyCashClosureService extends BaseService<
  DailyCashClosure,
  DailyCashClosure,
  CreateDaylyCashClosure,
  UpdateDailyCashClosure,
  DailyCashClosureFilter
>  {
  constructor() {
    super(getDailyCashClosureRepository());
  }

  protected async toView(entity: DailyCashClosure): Promise<DailyCashClosure> {
    return entity;
  }
}

export const dailyCashClosureService = new DailyCashClosureService();