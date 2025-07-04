import { getDailyCashClosureRepository } from "../db/repositories/dailyCashClosure.repository";
import type { DailyCashClosure } from "../types/DailyCashClosure";

const getRepository = () => getDailyCashClosureRepository();

export const createDailyCashClosure = async (
  data: Omit<DailyCashClosure, "id">
): Promise<DailyCashClosure> => {
  const repo = getRepository();

  // Validación básica: evitar duplicados por fecha y usuario
  const existing = await repo.findByDate(data.date);
  const exists = existing.find((c) => c.userId === data.userId);

  if (exists) {
    alert("Ya existe un arqueo de caja para ese día y usuario.");
  }

  return await repo.create(data);
};

export const getDailyCashClosuresPaginated = async (
  page: number,
  size: number,
  searchQuery?: string
) => {
  const repo = getRepository();
  return await repo.findAllPaginated(page, size, searchQuery);
};
