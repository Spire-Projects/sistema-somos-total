import type { IEntity } from "./UtilTypes";

export interface NIT extends IEntity {
 
  numberNit: string; // e.g. "123456789"
  socialReason: string; // e.g. "Empresa S.A."

}
