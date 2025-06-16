// Modelo DTO de ejemplo para requests/responses en TypeScript
export default class ExampleDTO {
  dato: string;
  constructor({ dato }: { dato: string }) {
    this.dato = dato;
  }
}
