import type { GenericNameDoc } from "@/shared/types/Medication";

let genericNames: GenericNameDoc[] = [];

export const getGenericNameDB = () => ({
  async findById(id: string): Promise<GenericNameDoc | null> {
    return genericNames.find((item) => item.id === id) ?? null;
  },

  async findByName(name: string): Promise<GenericNameDoc | null> {
    return (
      genericNames.find(
        (item) => item.name.toLowerCase() === name.toLowerCase()
      ) ?? null
    );
  },

  async findAll(): Promise<GenericNameDoc[]> {
    return genericNames.filter((item) => !item.isDeleted);
  },

  async create(data: GenericNameDoc): Promise<GenericNameDoc> {
    genericNames.push(data);
    return data;
  },

  async update(id: string, data: Partial<GenericNameDoc>): Promise<boolean> {
    const index = genericNames.findIndex((item) => item.id === id);
    if (index === -1) return false;
    genericNames[index] = { ...genericNames[index], ...data };
    return true;
  },

  async delete(id: string): Promise<boolean> {
    const index = genericNames.findIndex((item) => item.id === id);
    if (index === -1) return false;
    genericNames[index].isDeleted = true;
    return true;
  },

  async search(query: string): Promise<GenericNameDoc[]> {
    const q = query.toLowerCase();
    return genericNames.filter(
      (item) =>
        !item.isDeleted &&
        (item.name.toLowerCase().includes(q) ||
          item.aliases?.some((alias) => alias.toLowerCase().includes(q)))
    );
  },
});
