// Controlador de ejemplo en TypeScript
import { Request, Response } from 'express';
import ExampleDTO from '../models/example.dto';

export const getExample = (_req: Request, res: Response) => {
  const example = new ExampleDTO({ dato: 'valor de ejemplo' });
  res.json(example);
};
