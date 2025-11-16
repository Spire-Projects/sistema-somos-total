import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import type { DailyCashClosure } from '@/shared/types/DailyCashClosure';
import { formatCurrency } from '../utils/calculations';

interface ClosureHistoryTableProps {
  items: DailyCashClosure[];
  userNames: { [key: string]: string };
  loading: boolean;
}

export const ClosureHistoryTable = ({
  items,
  userNames,
  loading,
}: ClosureHistoryTableProps) => {
  if (loading) {
    return <p>Cargando...</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Usuario</TableHead>
          <TableHead>Cierre</TableHead>
          <TableHead>Notas</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.date}</TableCell>
            <TableCell>{userNames[item.userId] || item.userId}</TableCell>
            <TableCell>{formatCurrency(item.closingAmount, 'bs')}</TableCell>
            <TableCell className="max-w-xs truncate">{item.notes || '-'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
